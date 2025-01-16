import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, lt } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { pusher } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'
import { getOrCreateUser } from '@/lib/db/users'
import { now } from '@/types/timestamp'

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
      id: clerkUserId,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses,
      imageUrl: clerkUser.imageUrl,
    })

    // Update user's last heartbeat
    await db.update(users)
      .set({
        lastHeartbeat: now(),
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating heartbeat:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 