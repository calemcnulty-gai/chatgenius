import { findNotification } from './queries'
import type { NotificationError } from './types'

export async function validateNotificationAccess(
  userId: string,
  notificationId: string
): Promise<NotificationError | null> {
  const notification = await findNotification(userId, notificationId)
  
  if (!notification) {
    return {
      message: 'Notification not found',
      code: 'NOT_FOUND'
    }
  }

  return null
}

export function validateLimit(limit?: number): number {
  if (!limit) return 50
  if (limit < 1) return 1
  if (limit > 100) return 100
  return limit
} 