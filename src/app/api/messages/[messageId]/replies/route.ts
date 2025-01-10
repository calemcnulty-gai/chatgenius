import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { messages, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { pusherServer } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'

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
    })

    if (!parentMessage) {
      return Response.json({ error: 'Parent message not found' }, { status: 404 })
    }

    // Create the reply using internal ID
    const [reply] = await db.insert(messages).values({
      content: content.trim(),
      channelId,
      senderId: user.id,
      parentMessageId: params.messageId,
    }).returning()

    // Update the parent message's reply count and latest reply timestamp
    await db
      .update(messages)
      .set({
        replyCount: (parentMessage.replyCount || 0) + 1,
        latestReplyAt: new Date().toISOString(),
      })
      .where(eq(messages.id, params.messageId))

    // Trigger real-time updates
    // 1. Send the thread reply event to the channel
    await pusherServer.trigger(
      `channel-${channelId}`,
      PusherEvent.NEW_THREAD_REPLY,
      {
        id: reply.id,
        content: reply.content,
        channelId: reply.channelId,
        senderId: user.id,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        parentId: reply.parentMessageId,
      }
    )

    // 2. Update the parent message's reply count
    await pusherServer.trigger(
      `channel-${channelId}`,
      PusherEvent.MESSAGE_UPDATED,
      {
        id: params.messageId,
        channelId,
        replyCount: (parentMessage.replyCount || 0) + 1,
        latestReplyAt: new Date().toISOString(),
      }
    )

    return Response.json(reply)
  } catch (error) {
    console.error('[Thread Reply API] Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 