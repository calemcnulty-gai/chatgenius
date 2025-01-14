import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { messages, users, workspaceMemberships, channels, workspaces } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { pusherServer } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'
import { v4 as uuidv4 } from 'uuid'
import { now } from '@/types/timestamp'

export async function POST(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    // Initial auth check with Clerk
    const { userId: clerkId } = auth()
    if (!clerkId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get internal user ID once at the start
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const { content, channelId } = await req.json()
    if (!content?.trim()) {
      return Response.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify the parent message exists
    const parentMessage = await db.query.messages.findFirst({
      where: eq(messages.id, params.messageId),
      with: {
        channel: {
          with: {
            workspace: true
          }
        }
      }
    }) as (typeof messages.$inferSelect & {
      channel: typeof channels.$inferSelect & {
        workspace: typeof workspaces.$inferSelect
      }
    }) | null

    if (!parentMessage) {
      return Response.json({ error: 'Parent message not found' }, { status: 404 })
    }

    // Create the reply using internal ID
    console.log('Messages: Creating new thread reply:', {
      channelId,
      senderId: user.id,
      parentMessageId: params.messageId
    })

    const timestamp = new Date().toISOString()
    const [reply] = await db.insert(messages).values({
      content: content.trim(),
      channelId,
      dmChannelId: null,
      senderId: user.id,
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

    // Get all workspace members
    const workspaceMembers = await db.query.workspaceMemberships.findMany({
      where: eq(workspaceMemberships.workspaceId, parentMessage.channel.workspace.id),
    })

    // Prepare the event payload
    const threadReplyPayload = {
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      channelId: reply.channelId,
      channelName: 'thread-reply',
      workspaceId: parentMessage.channel.workspace.id,
      senderId: user.id,
      senderName: user.name,
      senderProfileImage: user.profileImage,
      hasMention: false,
      isThreadReply: true,
      parentMessageId: reply.parentMessageId,
      parentId: params.messageId
    }

    // Send event to each workspace member
    for (const member of workspaceMembers) {
      console.log('[API] Triggering thread reply event:', {
        channel: `user-${member.userId}`,
        event: PusherEvent.NEW_THREAD_REPLY,
        messageId: reply.id,
        channelId,
        senderId: user.id,
        recipientId: member.userId
      })

      await pusherServer.trigger(
        `user-${member.userId}`,
        PusherEvent.NEW_THREAD_REPLY,
        JSON.stringify(threadReplyPayload)
      )
    }

    return Response.json(reply)
  } catch (error) {
    console.error('[Thread Reply API] Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 