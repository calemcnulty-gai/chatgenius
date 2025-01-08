import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { messages, users, channels, directMessageChannels, directMessageMembers, notifications, unreadMessages, workspaceMemberships } from '@/db/schema'
import { and, eq, or, ne, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { pusherServer } from '@/lib/pusher'
import type { ChannelWithWorkspace, DirectMessageChannelWithMembers, MessageWithSender } from '@/types/db'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { channelId, content, parentMessageId } = await req.json()
    console.log('Messages: Creating new message:', { channelId, senderId: userId, parentMessageId })
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

    // Create message with text ID
    const messageId = `msg_${uuidv4()}`
    const [message] = await db.insert(messages).values({
      id: messageId,
      channelId: regularChannel ? channelId : null,
      dmChannelId: dmChannel ? channelId : null,
      senderId: userId,
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
      console.log(`[Messages API] Triggering new-message event for channel: channel-${channelId}`)
      await pusherServer.trigger(`channel-${channelId}`, 'new-message', {
        ...messageData,
        isChannel: true,
        channelId: channelId,
        channelSlug: regularChannel.slug,
      })
    }
    
    // If this is a reply, also trigger a thread-specific event
    if (parentMessageId) {
      console.log(`[Messages API] Triggering new-reply event for thread: thread-${parentMessageId}`)
      await pusherServer.trigger(`thread-${parentMessageId}`, 'new-reply', messageData)

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
          .filter(id => id !== userId)
      )]

      // Send notifications to all participants
      for (const participantId of participantIds) {
        await pusherServer.trigger(`user-${participantId}`, 'new-notification', {
          id: `notification_${uuidv4()}`,
          type: 'thread_reply',
          title: `New reply from ${user.name}`,
          body: content.length > 50 ? content.substring(0, 47) + '...' : content,
          read: false,
          createdAt: new Date().toISOString(),
          data: {
            channelId,
            messageId: message.id,
            senderId: userId,
            parentMessageId
          }
        })
      }

      // Also update the channel message list to show updated reply count
      await pusherServer.trigger(`channel-${channelId}`, 'thread-update', {
        messageId: parentMessageId,
        replyCount: updatedParentMessage?.replyCount || 0,
        latestReplyAt: updatedParentMessage?.latestReplyAt || new Date().toISOString()
      })
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
        if (member.userId !== userId) {
          const hasMention = mentionedUsers.includes(member.userId)

          // Update unread count
          const [updatedUnread] = await db.insert(unreadMessages).values({
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
          }).returning()

          // Trigger user-specific event for unread count
          const eventData = {
            channelId: regularChannel.id,
            messageId: message.id,
            senderId: userId,
            hasMention,
            isChannel: true,
            channelSlug: regularChannel.slug,
            isThreadReply: !!parentMessageId,
          }
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
          type: parentMessageId ? 'thread_reply' : 'dm',
          title: `New ${parentMessageId ? 'thread reply' : 'message'} from ${user.name}`,
          body: content.length > 50 ? content.substring(0, 47) + '...' : content,
          data: {
            channelId,
            messageId: message.id,
            senderId: userId,
            parentMessageId,
          },
        })

        // Trigger notification event
        await pusherServer.trigger(`user-${otherMember.userId}`, 'new-notification', {
          type: parentMessageId ? 'thread_reply' : 'dm',
          title: `New ${parentMessageId ? 'thread reply' : 'message'} from ${user.name}`,
          body: content.length > 50 ? content.substring(0, 47) + '...' : content,
          data: {
            channelId,
            messageId: message.id,
            senderId: userId,
            parentMessageId,
          },
        })

        // Trigger DM-specific event for unread count and message
        console.log(`[Messages API] Triggering new-message event for DM channel: channel-${channelId}`)
        await pusherServer.trigger(`channel-${channelId}`, 'new-message', {
          ...messageData,
          isDM: true,
          dmChannelId: channelId,
          channelId: channelId,
          hasMention: true,
          isThreadReply: !!parentMessageId,
          replyCount: 0,
          latestReplyAt: null,
          senderId: userId
        })

        // Also trigger user-specific event for the DM list
        console.log(`[Messages API] Triggering new-message event for user: user-${otherMember.userId}`)
        await pusherServer.trigger(`user-${otherMember.userId}`, 'new-message', {
          channelId,
          dmChannelId: channelId,
          messageId: message.id,
          senderId: userId,
          hasMention: true,
          isDM: true,
          isThreadReply: !!parentMessageId,
          content: messageData.content
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
  const cursor = searchParams.get('cursor') // For pagination
  const limit = Number(searchParams.get('limit')) || 50
  const includeReplies = searchParams.get('includeReplies') === 'true'

  if (!channelId) {
    return new Response('Channel ID is required', { status: 400 })
  }

  try {
    console.log('Fetching messages for channel:', channelId)
    console.log('Include replies:', includeReplies)

    // Build the base query
    const baseWhere = or(
      eq(messages.channelId, channelId),
      eq(messages.dmChannelId, channelId)
    )

    // If we don't want replies, only get parent messages or messages without parents
    const threadWhere = includeReplies 
      ? undefined 
      : sql`${messages.parentMessageId} IS NULL`

    // Combine the conditions
    const where = threadWhere 
      ? and(baseWhere, threadWhere)
      : baseWhere

    // Add cursor-based pagination
    const cursorCondition = cursor
      ? and(where, sql`${messages.createdAt} < ${new Date(cursor)}`)
      : where

    // Log the query conditions
    console.log('Query conditions:', {
      baseWhere,
      threadWhere,
      where,
      cursorCondition
    })

    // Fetch messages with sender info and reply counts
    const query = db.query.messages.findMany({
      where: cursorCondition,
      with: {
        sender: true,
      },
      orderBy: (messages, { desc }) => [desc(messages.createdAt)],
      limit: limit + 1, // Get one extra to check if there are more
    })

    // Log the SQL query
    const sqlQuery = query.toSQL()
    const parameterizedSql = sqlQuery.sql.replace(/\$(\d+)/g, (_: string, index: number): string => {
      const param = sqlQuery.params[index - 1]
      return typeof param === 'string' ? `'${param}'` : String(param)
    })
    console.log('Parameterized SQL Query:', parameterizedSql)

    const channelMessages = await query

    // Log the results
    console.log('Found messages:', channelMessages.length)
    console.log('First message:', channelMessages[0])

    // Check if there are more messages
    const hasMore = channelMessages.length > limit
    const resultMessages = hasMore ? channelMessages.slice(0, -1) : channelMessages
    const nextCursor = hasMore ? resultMessages[resultMessages.length - 1].createdAt.toISOString() : undefined

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

    return NextResponse.json({
      messages: resultMessages.map(message => ({
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
      })),
      hasMore,
      nextCursor,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return new Response('Error fetching messages', { status: 500 })
  }
} 