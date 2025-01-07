import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { messages, users } from '@/db/schema'
import { v4 as uuidv4 } from 'uuid'
import { eq, desc } from 'drizzle-orm'
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

    const messageId = uuidv4()
    
    // Get user details for the message
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Create message
    await db.insert(messages).values({
      id: messageId,
      channelId,
      senderId: userId,
      content,
      aiGenerated: false,
    })

    // Construct message object for real-time update
    const messageData = {
      id: messageId,
      content,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name,
        profileImage: user.profileImage,
      },
    }

    // Trigger Pusher event
    await pusherServer.trigger(`channel-${channelId}`, 'new-message', messageData)

    return NextResponse.json(messageData)
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

    const url = new URL(req.url)
    const channelId = url.searchParams.get('channelId')
    if (!channelId) {
      return new NextResponse('Missing channelId', { status: 400 })
    }

    // Use a simpler query first to debug
    const channelMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          name: users.name,
          profileImage: users.profileImage,
        },
      })
      .from(messages)
      .where(eq(messages.channelId, channelId))
      .innerJoin(users, eq(messages.senderId, users.id))
      .orderBy(desc(messages.createdAt))
      .limit(50)

    return NextResponse.json(channelMessages.reverse())
  } catch (error) {
    console.error('Error fetching messages:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 