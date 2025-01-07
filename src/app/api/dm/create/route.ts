import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { directMessageChannels, directMessageMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { workspaceId, otherUserId } = await req.json()
    if (!workspaceId || !otherUserId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Check if DM channel already exists between these users
    const existingChannel = await db.query.directMessageChannels.findFirst({
      where: eq(directMessageChannels.workspaceId, workspaceId),
      with: {
        members: true,
      },
    })

    const hasOtherUser = existingChannel?.members.some(m => m.userId === otherUserId)
    const hasCurrentUser = existingChannel?.members.some(m => m.userId === userId)

    if (existingChannel && hasOtherUser && hasCurrentUser) {
      return NextResponse.json({ channelId: existingChannel.id })
    }

    // Create new DM channel
    const [channel] = await db.insert(directMessageChannels).values({
      id: uuidv4(),
      workspaceId,
    }).returning()

    // Add both users to the channel
    await db.insert(directMessageMembers).values([
      {
        id: uuidv4(),
        channelId: channel.id,
        userId,
      },
      {
        id: uuidv4(),
        channelId: channel.id,
        userId: otherUserId,
      },
    ])

    return NextResponse.json({ channelId: channel.id })
  } catch (error) {
    console.error('Error creating DM channel:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 