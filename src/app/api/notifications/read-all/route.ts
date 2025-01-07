import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
  const { userId } = auth()
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Update all unread notifications for the user
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        eq(notifications.userId, userId)
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 