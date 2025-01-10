import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, lt } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { pusherServer } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'
import { getOrCreateUser } from '@/lib/db/users'

const OFFLINE_THRESHOLD = 60 // seconds

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

    // Update user's last heartbeat and status
    const [updatedUser] = await db
      .update(users)
      .set({ 
        status: 'active',
        lastHeartbeat: new Date()
      })
      .where(eq(users.id, user.id))
      .returning()

    // Find users who haven't sent a heartbeat recently and mark them as offline
    const offlineThreshold = new Date(Date.now() - OFFLINE_THRESHOLD * 1000)
    const usersToMarkOffline = await db
      .select()
      .from(users)
      .where(
        lt(users.lastHeartbeat, offlineThreshold)
      )

    // Update status for users who haven't sent a heartbeat
    for (const offlineUser of usersToMarkOffline) {
      if (offlineUser.status !== 'offline') {
        await db
          .update(users)
          .set({ status: 'offline' })
          .where(eq(users.id, offlineUser.id))

        // Notify about status change
        await pusherServer.trigger(`user-${offlineUser.id}`, PusherEvent.USER_STATUS_CHANGED, {
          userId: offlineUser.id,
          name: offlineUser.name,
          image: offlineUser.profileImage,
          status: 'offline',
        })
      }
    }

    // Trigger presence event for the active user
    await pusherServer.trigger(`user-${user.id}`, PusherEvent.USER_STATUS_CHANGED, {
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