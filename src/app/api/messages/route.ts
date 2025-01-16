import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { messages, mentions, directMessageMembers, users, channels } from '@/db/schema'
import { pusher } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'
import { User } from '@/types/user'
import { getMessages } from '@/lib/messages/services/retrieve'

// Helper function to extract mentions from message content
function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const matches = content.match(mentionRegex)
  if (!matches) return []
  return matches.map(match => match.slice(1)) // Remove @ symbol
}

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the full user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const body = await request.json()
    const { content, channelId, type, parentMessageId } = body

    // Validate required fields
    if (!content || !channelId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Get channel info
    const channel = type === 'channel'
      ? await db.query.channels.findFirst({
          where: eq(channels.id, channelId),
          columns: {
            id: true,
            name: true,
            slug: true,
            workspaceId: true,
          },
        })
      : null

    if (type === 'channel' && !channel) {
      return new NextResponse('Channel not found', { status: 404 })
    }

    // Create message
    const message = await db.transaction(async (tx) => {
      // Create the message first
      const [newMessage] = await tx.insert(messages).values({
        content,
        channelId: type === 'channel' ? channelId : null,
        dmChannelId: type === 'dm' ? channelId : null,
        senderId: userId,
        parentMessageId,
      }).returning()

      // If this is a channel message, handle mentions
      if (type === 'channel' && channel) {
        const mentionedUsernames = extractMentions(content)
        if (mentionedUsernames.length > 0) {
          // Get user IDs for the mentioned usernames
          const mentionedUsers = await tx.query.users.findMany({
            where: (users, { inArray }) => 
              inArray(users.name, mentionedUsernames),
            columns: {
              id: true,
              name: true,
            }
          })

          // Create mention records
          if (mentionedUsers.length > 0) {
            const mentionRecords = await tx.insert(mentions).values(
              mentionedUsers.map(mentionedUser => ({
                messageId: newMessage.id,
                userId: mentionedUser.id,
                channelId,
              }))
            ).returning()

            // Emit mention events
            for (const mention of mentionRecords) {
              await pusher.trigger(
                `private-user_${mention.userId}`,
                PusherEvent.NEW_MENTION,
                {
                  id: mention.id,
                  channelId: channel.id,
                  channelSlug: channel.slug,
                  channelName: channel.name,
                  messageId: newMessage.id,
                  userId: mention.userId,
                  createdAt: mention.createdAt,
                }
              )
            }
          }
        }
      }

      return newMessage
    })

    // Emit message event
    const eventData = {
      id: message.id,
      content: message.content,
      channelId,
      channelSlug: channel?.slug,
      channelName: channel?.name,
      senderId: userId,
      senderClerkId: user.clerkId,
      senderName: user.name,
      senderEmail: user.email,
      senderProfileImage: user.profileImage,
      senderDisplayName: user.displayName,
      senderTitle: user.title,
      senderTimeZone: user.timeZone,
      senderCreatedAt: user.createdAt,
      senderUpdatedAt: user.updatedAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      parentId: message.parentMessageId,
    }

    if (type === 'channel' && channel) {
      await pusher.trigger(`workspace_${channel.workspaceId}`, PusherEvent.NEW_CHANNEL_MESSAGE, eventData)
    } else {
      // For DMs, trigger event for each member
      const members = await db.query.directMessageMembers.findMany({
        where: eq(directMessageMembers.channelId, channelId),
        columns: {
          userId: true,
        },
      })

      for (const member of members) {
        await pusher.trigger(
          `private-user_${member.userId}`,
          PusherEvent.NEW_DIRECT_MESSAGE,
          eventData
        )
      }
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const messages = await getMessages({
      clerkUser,
      params: searchParams
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error in GET /api/messages:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 