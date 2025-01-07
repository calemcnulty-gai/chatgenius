import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { userId } = auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
      limit: 50,
    })

    return NextResponse.json(userNotifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return new Response('Error fetching notifications', { status: 500 })
  }
} 