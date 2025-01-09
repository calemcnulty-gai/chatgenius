import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { messages } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('[Thread API] Fetching thread for message:', params.messageId)

    // First, fetch the parent message with its sender
    const parentMessage = await db.query.messages.findFirst({
      where: eq(messages.id, params.messageId),
      with: {
        sender: true,
      },
    })

    if (!parentMessage) {
      console.log('[Thread API] Message not found:', params.messageId)
      return new NextResponse('Message not found', { status: 404 })
    }

    console.log('[Thread API] Found parent message:', {
      id: parentMessage.id,
      content: parentMessage.content,
      sender: parentMessage.sender.name
    })

    // Then fetch all replies to this message
    const replies = await db.query.messages.findMany({
      where: eq(messages.parentMessageId, params.messageId),
      with: {
        sender: true,
      },
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    })

    console.log('[Thread API] Found replies:', replies.length)

    return NextResponse.json({
      parentMessage: {
        id: parentMessage.id,
        content: parentMessage.content,
        createdAt: parentMessage.createdAt,
        sender: {
          id: parentMessage.sender.id,
          name: parentMessage.sender.name,
          profileImage: parentMessage.sender.profileImage,
        },
        replyCount: parentMessage.replyCount,
        latestReplyAt: parentMessage.latestReplyAt,
        channelId: parentMessage.channelId,
        dmChannelId: parentMessage.dmChannelId,
      },
      replies: replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        sender: {
          id: reply.sender.id,
          name: reply.sender.name,
          profileImage: reply.sender.profileImage,
        },
        parentMessageId: reply.parentMessageId,
        channelId: reply.channelId,
        dmChannelId: reply.dmChannelId,
      })),
    })
  } catch (error) {
    console.error('[Thread API] Error fetching thread:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 