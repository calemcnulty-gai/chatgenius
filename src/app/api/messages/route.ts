import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { messages, users, channels, directMessageChannels, directMessageMembers, notifications, unreadMessages, workspaceMemberships } from '@/db/schema'
import { and, eq, or, ne, sql, lt, isNull } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { pusherServer } from '@/lib/pusher'
import type { ChannelWithWorkspace, DirectMessageChannelWithMembers, MessageWithSender } from '@/types/db'
import { PusherEvent } from '@/types/events'
import { getOrCreateUser } from '@/lib/db/users'

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the full user data from Clerk
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get or create user to get their database ID
    const user = await getOrCreateUser({
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses,
      imageUrl: clerkUser.imageUrl,
    })

    const { channelId, content, parentMessageId } = await req.json()
    console.log('Messages: Creating new message:', { channelId, senderId: user.id, parentMessageId })
    if (!channelId || !content) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // If this is a reply, verify parent message exists and belongs to the same channel
    if (parentMessageId) {
      const parentMessage = await db.query.messages.findFirst({
        where: eq(messages.id, parentMessageId),
      })

      if (!parentMessage) {
        return new NextResponse('Parent message not found', { status: 404 })
      }

      // Verify parent message belongs to the same channel
      if (parentMessage.channelId !== channelId && parentMessage.dmChannelId !== channelId) {
        return new NextResponse('Parent message must be in the same channel', { status: 400 })
      }

      // Prevent nested threads (replies to replies)
      if (parentMessage.parentMessageId) {
        return new NextResponse('Nested threads are not allowed', { status: 400 })
      }
    }

    // Check if this is a regular channel or DM channel
    const regularChannel = await db.query.channels.findFirst({
      where: eq(channels.id, channelId),
      with: {
        workspace: true,
      },
    }) as ChannelWithWorkspace | null

    const dmChannel = await db.query.directMessageChannels.findFirst({
      where: eq(directMessageChannels.id, channelId),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    }) as DirectMessageChannelWithMembers | null

    if (!regularChannel && !dmChannel) {
      return new NextResponse('Channel not found', { status: 404 })
    }

    // Create message with UUID
    const messageId = uuidv4()
    const [message] = await db.insert(messages).values({
      id: messageId,
      channelId: regularChannel ? channelId : null,
      dmChannelId: dmChannel ? channelId : null,
      senderId: user.id,
      content,
      parentMessageId: parentMessageId || null,
    }).returning();

    // If this is a reply, update the parent message's metadata
    let updatedParentMessage
    if (parentMessageId) {
      [updatedParentMessage] = await db.update(messages)
        .set({
          replyCount: sql`${messages.replyCount} + 1`,
          latestReplyAt: new Date(),
        })
        .where(eq(messages.id, parentMessageId))
        .returning()
    }

    // Construct message object for response and Pusher
    const messageData = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      parentMessageId: message.parentMessageId,
      sender: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
      },
      // Include parent message metadata if this is a reply
      parentMessage: updatedParentMessage ? {
        id: updatedParentMessage.id,
        replyCount: updatedParentMessage.replyCount,
        latestReplyAt: updatedParentMessage.latestReplyAt,
      } : undefined,
    }

    // Trigger message events - for regular channels only
    if (regularChannel) {
      // Get all workspace members
      const workspaceMembers = await db.query.workspaceMemberships.findMany({
        where: eq(workspaceMemberships.workspaceId, regularChannel.workspaceId),
      })

      // Send the message to each member's user channel
      for (const member of workspaceMembers) {
        console.log('[API] Triggering message event:', {
          channel: `user-${member.userId}`,
          event: PusherEvent.NEW_CHANNEL_MESSAGE,
          messageId: message.id,
          channelId,
          senderId: user.id,
          recipientId: member.userId
        })
        
        await pusherServer.trigger(`user-${member.userId}`, PusherEvent.NEW_CHANNEL_MESSAGE, {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          channelId,
          channelName: regularChannel.slug,
          workspaceId: regularChannel.workspaceId,
          senderId: user.id,
          senderName: user.name,
          senderProfileImage: user.profileImage,
          hasMention: false,
          isThreadReply: !!parentMessageId
        })
      }
    }
    
    // If this is a reply, also trigger a thread-specific event
    if (parentMessageId) {
      // Get all users who have participated in this thread
      const threadParticipants = await db.query.messages.findMany({
        where: or(
          eq(messages.id, parentMessageId),
          eq(messages.parentMessageId, parentMessageId)
        ),
        with: {
          sender: true
        }
      })

      // Get unique participant IDs (excluding the current sender)
      const participantIds = [...new Set(
        threadParticipants
          .map(m => m.sender.id)
          .filter(id => id !== user.id)
      )]

      // Send notifications to all participants
      for (const participantId of participantIds) {
        // Send notification
        await pusherServer.trigger(`user-${participantId}`, PusherEvent.NEW_NOTIFICATION, {
          id: uuidv4(),
          type: 'thread_reply',
          title: `New reply from ${user.name}`,
          body: content.length > 50 ? content.substring(0, 47) + '...' : content,
          read: false,
          createdAt: new Date().toISOString(),
          data: {
            channelId,
            messageId: message.id,
            senderId: user.id,
            parentMessageId
          }
        })
      }

      // Also update the channel message list to show updated reply count
      if (regularChannel) {
        const workspaceMembers = await db.query.workspaceMemberships.findMany({
          where: eq(workspaceMemberships.workspaceId, regularChannel.workspaceId),
        })

        for (const member of workspaceMembers) {
          if (member.userId !== user.id) {  // Don't send to the sender
            await pusherServer.trigger(`user-${member.userId}`, PusherEvent.MESSAGE_UPDATED, {
              id: parentMessageId,
              content: updatedParentMessage?.content || '',
              channelId,
              updatedAt: updatedParentMessage?.latestReplyAt?.toISOString() || new Date().toISOString()
            })
          }
        }
      }
    }

    // Update unread counts for all users in the channel except the sender
    if (regularChannel) {
      // Get all workspace members
      const workspaceMembers = await db.query.workspaceMemberships.findMany({
        where: eq(workspaceMemberships.workspaceId, regularChannel.workspaceId),
      })

      // Check for mentions in the message
      const mentions = content.match(/@[\w-]+/g) || []
      const mentionedUsers = mentions.map((mention: string) => mention.slice(1))

      // Update unread counts for each member except the sender
      for (const member of workspaceMembers) {
        if (member.userId !== user.id) {
          const hasMention = mentionedUsers.includes(member.userId)

          // Update unread count
          const [updatedUnread] = await db.insert(unreadMessages).values({
            id: uuidv4(),
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
          }).returning()

          // Trigger user-specific event for unread count
          await pusherServer.trigger(`user-${member.userId}`, PusherEvent.NEW_CHANNEL_MESSAGE, {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            channelId: regularChannel.id,
            channelName: regularChannel.slug,
            workspaceId: regularChannel.workspaceId,
            senderId: user.id,
            senderName: user.name,
            senderProfileImage: user.profileImage,
            hasMention,
            isThreadReply: !!parentMessageId
          })
        }
      }
    } else if (dmChannel) {
      // For DM channel, update unread count for the other user
      const otherMember = dmChannel.members.find(member => member.userId !== user.id)
      if (otherMember) {
        // Update unread count for DM
        await db.insert(unreadMessages).values({
          id: uuidv4(),
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

        // Trigger user-specific event for unread count
        await pusherServer.trigger(`user-${otherMember.userId}`, PusherEvent.NEW_DIRECT_MESSAGE, {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt,
          channelId: dmChannel.id,
          workspaceId: dmChannel.workspaceId,
          senderId: user.id,
          senderName: user.name,
          senderProfileImage: user.profileImage,
          hasMention: true,
          isThreadReply: !!parentMessageId
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
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the full user data from Clerk
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get or create user to get their database ID
    const user = await getOrCreateUser({
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses,
      imageUrl: clerkUser.imageUrl,
    })

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const parentMessageId = searchParams.get('parentMessageId')
    const cursor = searchParams.get('cursor')
    const includeReplies = searchParams.get('includeReplies') === 'true'

    if (!channelId) {
      return new NextResponse('Channel ID is required', { status: 400 })
    }

    // Fetch messages with Drizzle
    const results = await db.query.messages.findMany({
      where: and(
        or(
          eq(messages.channelId, channelId),
          eq(messages.dmChannelId, channelId)
        ),
        isNull(messages.parentMessageId)
      ),
      with: {
        sender: true,
      },
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      limit: 50,
    })

    // Get the next cursor
    const nextCursor = results.length === 50 ? results[results.length - 1].createdAt.toISOString() : undefined

    // Format messages
    const formattedMessages = results.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        profileImage: message.sender.profileImage,
      },
      replyCount: message.replyCount,
      latestReplyAt: message.latestReplyAt,
      parentMessageId: message.parentMessageId,
    }))

    return NextResponse.json({
      messages: formattedMessages,
      hasMore: results.length === 50,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 