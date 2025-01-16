import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { db } from '@/db'
import { directMessageChannels, directMessageMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import type { Timestamp } from '@/types/timestamp'

type DMChannel = {
  id: string
  workspaceId: string
  createdAt: Timestamp
  updatedAt: Timestamp
  members: {
    userId: string
    channelId: string
    id: string
    createdAt: Timestamp
  }[]
}

export async function POST(req: Request) {
  try {
    const { userId, error } = await getAuthenticatedUserId()
    if (error || !userId) {
      return NextResponse.json(
        { error: error || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { workspaceId, userId: otherUserId } = await req.json()
    if (!workspaceId || !otherUserId) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    // Check if DM channel already exists between these users
    const existingChannels = await db.query.directMessageChannels.findMany({
      where: eq(directMessageChannels.workspaceId, workspaceId),
      with: {
        members: true,
      },
    }) as DMChannel[]

    const existingChannel = existingChannels.find(channel => {
      const hasOtherUser = channel.members.some(m => m.userId === otherUserId)
      const hasCurrentUser = channel.members.some(m => m.userId === userId)
      return hasOtherUser && hasCurrentUser
    })

    if (existingChannel) {
      return NextResponse.json({ 
        channelId: existingChannel.id,
        status: 'success'
      })
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
        userId: userId,
      },
      {
        id: uuidv4(),
        channelId: channel.id,
        userId: otherUserId,
      },
    ])

    return NextResponse.json({ 
      channelId: channel.id,
      status: 'success'
    })
  } catch (error) {
    console.error('Error creating DM channel:', error)
    return NextResponse.json(
      { error: { message: 'Failed to create DM channel', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 