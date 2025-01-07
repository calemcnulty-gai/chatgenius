import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { messages, users, channels, directMessageChannels, directMessageMembers, notifications, unreadMessages, workspaceMemberships } from '@/db/schema'
import { and, eq, or, ne, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { pusherServer } from '@/lib/pusher'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { channelId, content } = await req.json()
    if (!channelId || !content) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Get user details for the message
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Check if this is a regular channel or DM channel
    const regularChannel = await db.query.channels.findFirst({
      where: eq(channels.id, channelId),
      with: {
        workspace: true,
      },
    })

    const dmChannel = await db.query.directMessageChannels.findFirst({
      where: eq(directMessageChannels.id, channelId),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    })

    if (!regularChannel && !dmChannel) {
      return new NextResponse('Channel not found', { status: 404 })
    }

    // Create message with text ID
    const messageId = `msg_${uuidv4()}`
    const [message] = await db.insert(messages).values({
      id: messageId,
      channelId: regularChannel ? channelId : null,
      dmChannelId: dmChannel ? channelId : null,
      senderId: userId,
      content,
    }).returning();

    // Construct message object for response and Pusher
    const messageData = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      sender: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
      },
    }

    // Trigger message event for the channel itself
    await pusherServer.trigger(`channel-${channelId}`, 'new-message', messageData)

    // Update unread counts for all users in the channel except the sender
    if (regularChannel) {
      console.log('Processing regular channel message:', {
        channelId,
        workspaceId: regularChannel.workspace.id,
        senderId: userId,
      })

      // Get all workspace members
      const workspaceMembers = await db.query.workspaceMemberships.findMany({
        where: eq(workspaceMemberships.workspaceId, regularChannel.workspace.id),
      })

      console.log('Found workspace members:', workspaceMembers.map(m => m.userId))

      // Check for mentions in the message
      const mentions = content.match(/@[\w-]+/g) || []
      const mentionedUsers = mentions.map((mention: string) => mention.slice(1))

      // Update unread counts for each member except the sender
      for (const member of workspaceMembers) {
        if (member.userId !== userId) {
          const hasMention = mentionedUsers.includes(member.userId)
          console.log('Updating unread count for member:', {
            memberId: member.userId,
            channelId,
            hasMention,
          })

          await db.insert(unreadMessages).values({
            id: `unread_${uuidv4()}`,
            userId: member.userId,
            channelId,
            unreadCount: 1,
            hasMention,
          }).onConflictDoUpdate({
            target: [unreadMessages.userId, unreadMessages.channelId],
            set: {
              unreadCount: sql`${unreadMessages.unreadCount} + 1`,
              hasMention: sql`${unreadMessages.hasMention} OR ${hasMention}`,
              updatedAt: new Date(),
            },
          })

          // Trigger user-specific event for unread count
          const eventData = {
            channelId,
            messageId: message.id,
            senderId: userId,
            hasMention,
            isChannel: true,
          }
          console.log('Triggering new-message event for user:', {
            userId: member.userId,
            eventData,
          })
          await pusherServer.trigger(`user-${member.userId}`, 'new-message', eventData)
        }
      }
    } else if (dmChannel) {
      // For DM channel, update unread count for the other user
      const otherMember = dmChannel.members.find(member => member.userId !== userId)
      if (otherMember) {
        // Update unread count for DM
        await db.insert(unreadMessages).values({
          id: `unread_${uuidv4()}`,
          userId: otherMember.userId,
          dmChannelId: channelId,
          unreadCount: 1,
          hasMention: true, // DMs are always treated as mentions
        }).onConflictDoUpdate({
          target: [unreadMessages.userId, unreadMessages.dmChannelId],
          set: {
            unreadCount: sql`${unreadMessages.unreadCount} + 1`,
            hasMention: true,
            updatedAt: new Date(),
          },
        })

        // Create notification
        await db.insert(notifications).values({
          id: `notif_${uuidv4()}`,
          userId: otherMember.userId,
          type: 'dm',
          title: `New message from ${user.name}`,
          body: content.length > 50 ? content.substring(0, 47) + '...' : content,
          data: {
            channelId,
            messageId: message.id,
            senderId: userId,
          },
        })

        // Trigger notification event
        await pusherServer.trigger(`user-${otherMember.userId}`, 'new-notification', {
          type: 'dm',
          title: `New message from ${user.name}`,
          body: content.length > 50 ? content.substring(0, 47) + '...' : content,
          data: {
            channelId,
            messageId: message.id,
            senderId: userId,
          },
        })

        // Trigger DM-specific event for unread count
        await pusherServer.trigger(`user-${otherMember.userId}`, 'new-message', {
          channelId,
          messageId: message.id,
          senderId: userId,
          hasMention: true,
          isDM: true,
        })
      }
    }

    // Also trigger an event for the recipient's unread count
    if (dmChannel) {
      const otherMember = dmChannel.members.find(member => member.userId !== userId)
      if (otherMember) {
        await pusherServer.trigger(`user-${otherMember.userId}`, 'new-message', {
          channelId,
          messageId: message.id,
          senderId: userId,
        })
      }
    }

    return NextResponse.json(messageData)
  } catch (error) {
    console.error('Error creating message:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET(request: Request) {
  const { userId } = auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')

  if (!channelId) {
    return new Response('Channel ID is required', { status: 400 })
  }

  try {
    // Check if this is a regular channel or DM channel
    const channelMessages = await db.query.messages.findMany({
      where: or(
        eq(messages.channelId, channelId),
        eq(messages.dmChannelId, channelId)
      ),
      with: {
        sender: true
      },
      orderBy: (messages, { asc }) => [asc(messages.createdAt)]
    })

    // Reset unread count when fetching messages
    await db.update(unreadMessages)
      .set({ 
        unreadCount: 0,
        hasMention: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(unreadMessages.userId, userId),
          or(
            eq(unreadMessages.channelId, channelId),
            eq(unreadMessages.dmChannelId, channelId)
          )
        )
      )

    // Mark related notifications as read
    await db.update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, userId),
          sql`${notifications.data}->>'channelId' = ${channelId}`
        )
      )

    // Trigger notification-read event
    await pusherServer.trigger(`user-${userId}`, 'notification-read', {
      channelId,
    })

    return NextResponse.json(channelMessages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return new Response('Error fetching messages', { status: 500 })
  }
} 