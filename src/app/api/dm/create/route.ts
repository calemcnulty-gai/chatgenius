import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { directMessageChannels, directMessageMembers } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getOrCreateUser } from '@/lib/db/users'

type DMChannel = {
  id: string
  workspaceId: string
  createdAt: Date
  updatedAt: Date
  members: {
    userId: string
    channelId: string
    id: string
    createdAt: Date
  }[]
}

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return NextResponse.json({ 
        message: 'Unauthorized',
        status: 'error'
      }, { status: 401 })
    }

    // Get the full user data from Clerk
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ 
        message: 'User not found',
        status: 'error'
      }, { status: 404 })
    }

    // Get or create user to get their database ID
    const user = await getOrCreateUser({
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses,
      imageUrl: clerkUser.imageUrl,
    })

    const { workspaceId, userId: otherUserId } = await req.json()
    if (!workspaceId || !otherUserId) {
      return NextResponse.json({ 
        message: 'Missing required fields',
        status: 'error'
      }, { status: 400 })
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
      const hasCurrentUser = channel.members.some(m => m.userId === user.id)
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
        userId: user.id,
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
    return NextResponse.json({ 
      message: 'Failed to create DM channel',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 