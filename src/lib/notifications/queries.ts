import { db } from '@/db'
import { notifications } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import type { Notification } from './types'

export async function getUserNotifications(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  return await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    limit,
  })
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
}

export async function markAllNotificationsAsRead(
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId))
}

export async function findNotification(
  userId: string,
  notificationId: string
): Promise<Notification | undefined> {
  return await db.query.notifications.findFirst({
    where: and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ),
  })
} 