import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { pusherServer } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'
import { getOrCreateUser } from '@/lib/db/users'

export async function POST() {
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

    // Update user status
    const [updatedUser] = await db
      .update(users)
      .set({ status: 'offline' })
      .where(eq(users.id, user.id))
      .returning()

    // Trigger presence event
    await pusherServer.trigger(`user-${user.id}`, PusherEvent.USER_STATUS_CHANGED, {
      userId: user.id,
      name: user.name,
      image: user.profileImage,
      status: 'offline',
    })

    // Terminate all connections for this user
    await pusherServer.terminateUserConnections(user.id)

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error terminating connections:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 