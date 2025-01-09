import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { pusherServer } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'
import { getOrCreateUser } from '@/lib/db/users'

export async function POST(req: Request) {
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

    const { socketId } = await req.json()
    if (!socketId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Update user status
    const [updatedUser] = await db
      .update(users)
      .set({ status: 'active' })
      .where(eq(users.id, user.id))
      .returning()

    // Trigger presence event
    await pusherServer.trigger('presence-status', PusherEvent.USER_STATUS_CHANGED, {
      userId: user.id,
      name: user.name,
      image: user.profileImage,
      status: 'active',
      socketId,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user status:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 