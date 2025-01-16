import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { eq, and, isNull } from 'drizzle-orm'
import { mentions, channelMentions } from '@/db/schema'

export async function GET(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    // Get unread mentions for the user
    const query = channelId
      ? and(eq(mentions.userId, userId), eq(mentions.channelId, channelId), isNull(mentions.readAt))
      : and(eq(mentions.userId, userId), isNull(mentions.readAt))

    const unreadMentions = await db.query.mentions.findMany({
      where: query,
      with: {
        message: true,
        channel: true,
      },
      orderBy: (mentions, { desc }) => [desc(mentions.createdAt)],
    })

    return NextResponse.json({ mentions: unreadMentions })
  } catch (error) {
    console.error('Error getting mentions:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Mark mentions as read
export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { channelId } = await request.json()
    if (!channelId) {
      return new NextResponse('Channel ID is required', { status: 400 })
    }

    // Mark all mentions in the channel as read
    const now = new Date()
    await db.transaction(async (tx) => {
      // Update mentions
      await tx
        .update(mentions)
        .set({ readAt: now })
        .where(
          and(
            eq(mentions.userId, userId),
            eq(mentions.channelId, channelId),
            isNull(mentions.readAt)
          )
        )

      // Reset channel mention count
      await tx
        .update(channelMentions)
        .set({ unreadCount: 0 })
        .where(
          and(
            eq(channelMentions.userId, userId),
            eq(channelMentions.channelId, channelId)
          )
        )
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking mentions as read:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 