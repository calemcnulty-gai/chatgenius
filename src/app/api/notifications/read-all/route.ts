import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq } from 'drizzle-orm'
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

    // Mark all notifications as read
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, user.id))

    return new NextResponse('OK')
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 