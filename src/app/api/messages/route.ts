import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { messages, channels, directMessageChannels, unreadMessages, workspaceMemberships, users, directMessageMembers } from '@/db/schema'
import { and, eq, gt, isNull, lt, or, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { pusherServer } from '@/lib/pusher'
import { getOrCreateUser } from '@/lib/db/users'
import type { ChannelWithWorkspace, DirectMessageChannelWithMembers, MessageWithSender } from '@/types/db'
import { PusherEvent } from '@/types/events'
import { Timestamp, createTimestamp, now } from '@/types/timestamp'
import { messageQueue } from '@/workers/messageUpload/queue'
import { messageUploadWorker, ensureWorkerRunning } from '@/workers/messageUpload/worker'
import { parseAICommand, generateAIResponse } from '@/lib/ai/commands'

export async function POST(req: Request) {
  try {
    console.log('[MESSAGES] Received POST request:', {
      url: req.url,
      method: req.method
    })

    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      console.log('[MESSAGES] Unauthorized - no clerkUserId')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the full user data from Clerk
    const clerkUser = await currentUser()
    if (!clerkUser) {
      console.log('[MESSAGES] User not found - no clerkUser')
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

    const body = await req.json()
    console.log('[MESSAGES] Request body:', {
      ...body,
      content: body.content?.substring(0, 100) + (body.content?.length > 100 ? '...' : '')
    })

    const { channelId, content, parentMessageId } = body
    console.log('Messages: Creating new message:', { channelId, senderId: user.id, parentMessageId })
    if (!channelId || !content) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Check if this is a regular channel or DM channel
    const rawChannel = await db.query.channels.findFirst({
      where: eq(channels.id, channelId),
      with: {
        workspace: true,
      },
    })

    const regularChannel = rawChannel

    // Get DM channel with all required fields
    const rawDMChannel = await db.query.directMessageChannels.findFirst({
      where: eq(directMessageChannels.id, channelId),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    }) as (typeof directMessageChannels.$inferSelect & {
      members: (typeof directMessageMembers.$inferSelect & {
        user: typeof users.$inferSelect
      })[]
    }) | null;

    const dmChannel = rawDMChannel ? {
      ...rawDMChannel,
      createdAt: rawDMChannel.createdAt,
      updatedAt: rawDMChannel.updatedAt,
      members: rawDMChannel.members.map(m => ({
        ...m,
        createdAt: m.createdAt,
        user: {
          ...m.user,
          createdAt: m.user.createdAt,
          updatedAt: m.user.updatedAt,
        }
      }))
    } as DirectMessageChannelWithMembers : null;

    if (!regularChannel && !dmChannel) {
      return new NextResponse('Channel not found', { status: 404 })
    }

    // Check for AI command
    const aiCommand = parseAICommand(content)
    if (aiCommand) {
      // First, save the human user's message (without the /ai command)
      const humanMessageId = uuidv4()
      const humanTimestamp = now()
      
      const [humanMessage] = await db.insert(messages).values({
        id: humanMessageId,
        channelId: regularChannel ? channelId : null,
        dmChannelId: dmChannel ? channelId : null,
        senderId: user.id,
        content: content.slice(content.indexOf(' ', 4) + 1), // Remove '/ai @username '
        parentMessageId: null,
        createdAt: humanTimestamp,
        updatedAt: humanTimestamp,
        replyCount: 0,
        latestReplyAt: null,
        editedAt: null,
      }).returning()

      // Queue human message for vector embedding
      await messageQueue.add({
        id: humanMessage.id,
        content: humanMessage.content,
      })

      // Find the AI user
      const aiUser = await db.query.users.findFirst({
        where: eq(users.name, aiCommand.aiUser)
      })

      if (!aiUser) {
        return new NextResponse('AI user not found', { status: 404 })
      }

      // Generate AI response using the human message
      const aiResponse = await generateAIResponse({
        aiUser: aiCommand.aiUser,
        query: humanMessage.content,
        messageId: humanMessage.id
      })
      
      // Then create the AI response message
      const messageId = uuidv4()
      const timestamp = now()
      
      const [message] = await db.insert(messages).values({
        id: messageId,
        channelId: regularChannel ? channelId : null,
        dmChannelId: dmChannel ? channelId : null,
        senderId: aiUser.id,
        content: aiResponse,
        parentMessageId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        replyCount: 0,
        latestReplyAt: null,
        editedAt: null,
      }).returning()

      // Queue AI message for vector embedding
      await messageQueue.add({
        id: message.id,
        content: message.content,
      })

      // If this is a reply, update the parent message's metadata
      let updatedParentMessage: typeof message | undefined
      if (parentMessageId) {
        const updateTimestamp = now()
        const [updated] = await db.update(messages)
          .set({
            replyCount: sql`${messages.replyCount} + 1`,
            latestReplyAt: updateTimestamp,
            updatedAt: updateTimestamp,
          })
          .where(eq(messages.id, parentMessageId))
          .returning()
        updatedParentMessage = updated
      }

      // Construct message object for response and Pusher
      const messageData: MessageWithSender = {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        editedAt: message.editedAt,
        latestReplyAt: message.latestReplyAt,
        senderId: aiUser.id,
        channelId: message.channelId,
        dmChannelId: message.dmChannelId,
        parentMessageId: message.parentMessageId,
        replyCount: message.replyCount,
        attachments: message.attachments,
        sender: {
          id: aiUser.id,
          name: aiUser.name,
          email: aiUser.email,
          clerkId: aiUser.clerkId,
          profileImage: aiUser.profileImage,
          createdAt: aiUser.createdAt,
          updatedAt: aiUser.updatedAt,
          status: 'online' as const,
          displayName: null,
          title: null,
          timeZone: null,
          lastHeartbeat: null
        }
      }

      // Trigger message events - for regular channels only
      if (regularChannel) {
        // Get all workspace members
        const workspaceMembers = await db.query.workspaceMemberships.findMany({
          where: eq(workspaceMemberships.workspaceId, regularChannel.workspaceId),
        })

        const currentTimestamp = new Date().toISOString()

        // Send the message to each member's user channel
        for (const member of workspaceMembers) {
          console.log('[API] Triggering message event:', {
            channel: `user-${member.userId}`,
            event: PusherEvent.NEW_CHANNEL_MESSAGE,
            messageId: message.id,
            channelId,
            senderId: aiUser.id,
            recipientId: member.userId
          })
          
          await pusherServer.trigger(`user-${member.userId}`, PusherEvent.NEW_CHANNEL_MESSAGE, {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            channelId,
            channelName: regularChannel.slug,
            workspaceId: regularChannel.workspaceId,
            senderId: aiUser.id,
            senderName: aiUser.name,
            senderProfileImage: aiUser.profileImage,
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
        }) as (typeof messages.$inferSelect & {
          sender: typeof users.$inferSelect
        })[]

        // Get unique participant IDs (excluding the current sender)
        const participantIds = [...new Set(
          threadParticipants
            .map(m => m.sender.id)
            .filter(id => id !== aiUser.id)
        )]

        const notificationTimestamp = new Date().toISOString()

        // Send notifications to all participants
        for (const participantId of participantIds) {
          // Send notification
          await pusherServer.trigger(`user-${participantId}`, PusherEvent.NEW_NOTIFICATION, {
            id: uuidv4(),
            type: 'thread_reply',
            title: `New reply from ${aiUser.name}`,
            body: message.content.length > 50 ? message.content.substring(0, 47) + '...' : message.content,
            read: false,
            createdAt: notificationTimestamp,
            data: {
              channelId,
              messageId: message.id,
              senderId: aiUser.id,
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
            if (member.userId !== aiUser.id) {  // Don't send to the sender
              await pusherServer.trigger(`user-${member.userId}`, PusherEvent.MESSAGE_UPDATED, {
                id: parentMessageId,
                content: updatedParentMessage?.content || '',
                channelId,
                updatedAt: updatedParentMessage?.latestReplyAt || new Date().toISOString()
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
        const mentions = message.content.match(/@[\w-]+/g) || []
        const mentionedUsers = mentions.map((mention: string) => mention.slice(1))

        // Update unread counts for each member except the sender
        for (const member of workspaceMembers) {
          if (member.userId !== aiUser.id) {
            const hasMention = mentionedUsers.includes(member.userId)
            const currentTimestamp = now()

            // Update unread count
            const [updatedUnread] = await db.insert(unreadMessages).values({
              id: uuidv4(),
              userId: member.userId,
              channelId,
              unreadCount: 1,
              hasMention,
              updatedAt: currentTimestamp,
            }).onConflictDoUpdate({
              target: [unreadMessages.userId, unreadMessages.channelId],
              set: {
                unreadCount: sql`${unreadMessages.unreadCount} + 1`,
                hasMention: sql`${unreadMessages.hasMention} OR ${hasMention}`,
                updatedAt: currentTimestamp,
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
              senderId: aiUser.id,
              senderName: aiUser.name,
              senderProfileImage: aiUser.profileImage,
              hasMention,
              isThreadReply: !!parentMessageId
            })
          }
        }
      } else if (dmChannel?.members) {
        // For DM channel, update unread count for the other user
        const otherMember = dmChannel.members.find(member => member.userId !== aiUser.id)
        if (otherMember) {
          const currentTimestamp = now()
          
          // Update unread count for DM
          await db.insert(unreadMessages).values({
            id: uuidv4(),
            userId: otherMember.userId,
            dmChannelId: channelId,
            unreadCount: 1,
            hasMention: true,
            updatedAt: currentTimestamp,
          }).onConflictDoUpdate({
            target: [unreadMessages.userId, unreadMessages.dmChannelId],
            set: {
              unreadCount: sql`${unreadMessages.unreadCount} + 1`,
              hasMention: true,
              updatedAt: currentTimestamp,
            },
          })

          // Trigger user-specific event for unread count
          await pusherServer.trigger(`user-${otherMember.userId}`, PusherEvent.NEW_DIRECT_MESSAGE, {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            channelId: dmChannel.id,
            workspaceId: dmChannel.workspaceId,
            senderId: aiUser.id,
            senderName: aiUser.name,
            senderProfileImage: aiUser.profileImage,
            hasMention: true,
            isThreadReply: !!parentMessageId
          })
        }
      }

      return NextResponse.json({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        editedAt: message.editedAt,
        latestReplyAt: message.latestReplyAt,
        senderId: aiUser.id,
        channelId: message.channelId,
        dmChannelId: message.dmChannelId,
        parentMessageId: message.parentMessageId,
        replyCount: message.replyCount,
        attachments: message.attachments,
        sender: {
          id: aiUser.id,
          name: aiUser.name,
          email: aiUser.email,
          clerkId: aiUser.clerkId,
          profileImage: aiUser.profileImage,
          createdAt: aiUser.createdAt,
          updatedAt: aiUser.updatedAt,
          status: 'online' as const,
          displayName: null,
          title: null,
          timeZone: null,
          lastHeartbeat: null
        }
      })
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

    // Create timestamps for database and response
    const timestamp = now()

    // Create message with UUID
    const messageId = uuidv4()
    const [message] = await db.insert(messages).values({
      id: messageId,
      channelId: regularChannel ? channelId : null,
      dmChannelId: dmChannel ? channelId : null,
      senderId: user.id,
      content,
      parentMessageId: parentMessageId || null,
      createdAt: timestamp,
      updatedAt: timestamp,
      replyCount: 0,
      latestReplyAt: null,
      editedAt: null,
    }).returning();

    // Queue message for vector embedding
    await messageQueue.add({
      id: message.id,
      content: message.content,
    })
    
    // Ensure worker is running (non-blocking)
    ensureWorkerRunning().catch(console.error)

    // If this is a reply, update the parent message's metadata
    let updatedParentMessage: typeof message | undefined
    if (parentMessageId) {
      const updateTimestamp = now()
      const [updated] = await db.update(messages)
        .set({
          replyCount: sql`${messages.replyCount} + 1`,
          latestReplyAt: updateTimestamp,
          updatedAt: updateTimestamp,
        })
        .where(eq(messages.id, parentMessageId))
        .returning()
      updatedParentMessage = updated
    }

    // Construct message object for response and Pusher
    const messageData: MessageWithSender = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      editedAt: message.editedAt,
      latestReplyAt: message.latestReplyAt,
      senderId: user.id,
      channelId: message.channelId,
      dmChannelId: message.dmChannelId,
      parentMessageId: message.parentMessageId,
      replyCount: message.replyCount,
      attachments: message.attachments,
      sender: {
        id: user.id,
        name: user.name,
        email: user.email,
        clerkId: user.clerkId,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: 'offline' as const,
        displayName: null,
        title: null,
        timeZone: null,
        lastHeartbeat: null
      }
    }

    // Trigger message events - for regular channels only
    if (regularChannel) {
      // Get all workspace members
      const workspaceMembers = await db.query.workspaceMemberships.findMany({
        where: eq(workspaceMemberships.workspaceId, regularChannel.workspaceId),
      })

      const currentTimestamp = new Date().toISOString()

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
      }) as (typeof messages.$inferSelect & {
        sender: typeof users.$inferSelect
      })[]

      // Get unique participant IDs (excluding the current sender)
      const participantIds = [...new Set(
        threadParticipants
          .map(m => m.sender.id)
          .filter(id => id !== user.id)
      )]

      const notificationTimestamp = new Date().toISOString()

      // Send notifications to all participants
      for (const participantId of participantIds) {
        // Send notification
        await pusherServer.trigger(`user-${participantId}`, PusherEvent.NEW_NOTIFICATION, {
          id: uuidv4(),
          type: 'thread_reply',
          title: `New reply from ${user.name}`,
          body: message.content.length > 50 ? message.content.substring(0, 47) + '...' : message.content,
          read: false,
          createdAt: notificationTimestamp,
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
              updatedAt: updatedParentMessage?.latestReplyAt || new Date().toISOString()
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
      const mentions = message.content.match(/@[\w-]+/g) || []
      const mentionedUsers = mentions.map((mention: string) => mention.slice(1))

      // Update unread counts for each member except the sender
      for (const member of workspaceMembers) {
        if (member.userId !== user.id) {
          const hasMention = mentionedUsers.includes(member.userId)
          const currentTimestamp = now()

          // Update unread count
          const [updatedUnread] = await db.insert(unreadMessages).values({
            id: uuidv4(),
            userId: member.userId,
            channelId,
            unreadCount: 1,
            hasMention,
            updatedAt: currentTimestamp,
          }).onConflictDoUpdate({
            target: [unreadMessages.userId, unreadMessages.channelId],
            set: {
              unreadCount: sql`${unreadMessages.unreadCount} + 1`,
              hasMention: sql`${unreadMessages.hasMention} OR ${hasMention}`,
              updatedAt: currentTimestamp,
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
    } else if (dmChannel?.members) {
      // For DM channel, update unread count for the other user
      const otherMember = dmChannel.members.find(member => member.userId !== user.id)
      if (otherMember) {
        const currentTimestamp = now()
        
        // Update unread count for DM
        await db.insert(unreadMessages).values({
          id: uuidv4(),
          userId: otherMember.userId,
          dmChannelId: channelId,
          unreadCount: 1,
          hasMention: true,
          updatedAt: currentTimestamp,
        }).onConflictDoUpdate({
          target: [unreadMessages.userId, unreadMessages.dmChannelId],
          set: {
            unreadCount: sql`${unreadMessages.unreadCount} + 1`,
            hasMention: true,
            updatedAt: currentTimestamp,
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
      orderBy: (messages, { desc }) => [desc(messages.createdAt)],
      limit: 50,
      offset: cursor ? parseInt(cursor, 10) : 0
    }) as (typeof messages.$inferSelect & {
      sender: typeof users.$inferSelect
    })[]

    // Get the next cursor - since we're getting latest first, 
    // the next cursor should be the current offset + results length
    const nextCursor = results.length === 50 ? (cursor ? parseInt(cursor, 10) : 0) + 50 : undefined

    // Transform and format messages - reverse to show earliest to latest
    const formattedMessages = results.reverse().map(message => {
      return {
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
      }
    })

    return NextResponse.json({
      messages: formattedMessages,
      hasMore: results.length === 50,
      nextCursor: nextCursor || undefined,
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 