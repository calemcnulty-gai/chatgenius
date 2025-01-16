import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { db } from '@/db'
import { messages, users, workspaceMemberships, channels, workspaces, directMessageChannels } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { pusher } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'
import { v4 as uuidv4 } from 'uuid'
import { now } from '@/types/timestamp'

export async function POST(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const { userId, error } = await getAuthenticatedUserId()
    if (error || !userId) {
      return NextResponse.json(
        { error: error || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return NextResponse.json(
        { error: { message: 'User not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const { content, channelId } = await req.json()
    if (!content?.trim()) {
      return NextResponse.json(
        { error: { message: 'Content is required', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    // Verify the parent message exists
    const parentMessage = await db.query.messages.findFirst({
      where: eq(messages.id, params.messageId),
      with: {
        channel: {
          with: {
            workspace: true
          }
        },
        dmChannel: {
          with: {
            workspace: true
          }
        }
      }
    }) as (typeof messages.$inferSelect & {
      channel: (typeof channels.$inferSelect & {
        workspace: typeof workspaces.$inferSelect
      }) | null,
      dmChannel: (typeof directMessageChannels.$inferSelect & {
        workspace: typeof workspaces.$inferSelect
      }) | null
    }) | null

    if (!parentMessage) {
      return NextResponse.json(
        { error: { message: 'Parent message not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Get the workspace ID from either channel or DM channel
    const workspaceId = parentMessage.channel?.workspace.id || parentMessage.dmChannel?.workspace.id
    if (!workspaceId) {
      return NextResponse.json(
        { error: { message: 'Workspace not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Create the reply using internal ID
    console.log('Messages: Creating new thread reply:', {
      channelId,
      senderId: userId,
      parentMessageId: params.messageId
    })

    const [reply] = await db.insert(messages).values({
      content: content.trim(),
      channelId: parentMessage.channelId,
      dmChannelId: parentMessage.dmChannelId,
      senderId: userId,
      parentMessageId: params.messageId,
      replyCount: 0,
      attachments: null,
    }).returning()

    // Update the parent message's reply count and latest reply timestamp
    await db
      .update(messages)
      .set({
        replyCount: (parentMessage.replyCount || 0) + 1,
        latestReplyAt: now(),
        updatedAt: now(),
      })
      .where(eq(messages.id, params.messageId))

    // Emit message updated event
    await pusher.trigger(
      `workspace_${workspaceId}`,
      PusherEvent.MESSAGE_UPDATED,
      {
        id: params.messageId,
        replyCount: (parentMessage.replyCount || 0) + 1,
        latestReplyAt: now(),
        updatedAt: now(),
      }
    )

    // Get all workspace members
    const workspaceMembers = await db.query.workspaceMemberships.findMany({
      where: eq(workspaceMemberships.workspaceId, workspaceId),
    })

    // Prepare the event payload
    const threadReplyPayload = {
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      channelId: reply.channelId,
      dmChannelId: reply.dmChannelId,
      channelName: 'thread-reply',
      workspaceId,
      senderId: userId,
      senderName: user.name,
      senderEmail: user.email,
      senderProfileImage: user.profileImage,
      senderDisplayName: user.displayName,
      senderTitle: user.title,
      senderTimeZone: user.timeZone,
      senderCreatedAt: user.createdAt,
      senderUpdatedAt: user.updatedAt,
      hasMention: false,
      isThreadReply: true,
      parentMessageId: reply.parentMessageId,
      parentId: params.messageId
    }

    // Send event to each workspace member
    for (const member of workspaceMembers) {
      console.log('[API] Triggering thread reply event:', {
        channel: `private-user_${member.userId}`,
        event: PusherEvent.NEW_THREAD_REPLY,
        messageId: reply.id,
        channelId,
        senderId: userId,
        recipientId: member.userId
      })

      await pusher.trigger(
        `private-user_${member.userId}`,
        PusherEvent.NEW_THREAD_REPLY,
        threadReplyPayload
      )
    }

    return NextResponse.json(reply)
  } catch (error) {
    console.error('[Thread Reply API] Error:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 