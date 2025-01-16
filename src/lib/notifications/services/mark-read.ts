import { validateNotificationAccess } from '../validation'
import { markNotificationAsRead, markAllNotificationsAsRead } from '../queries'
import type { MarkAsReadParams, MarkAsReadResponse } from '../types'

export async function markRead({
  userId,
  notificationId
}: MarkAsReadParams): Promise<MarkAsReadResponse> {
  try {
    if (notificationId) {
      // Validate notification access
      const error = await validateNotificationAccess(userId, notificationId)
      if (error) {
        return { success: false, error }
      }

      // Mark single notification as read
      await markNotificationAsRead(userId, notificationId)
    } else {
      // Mark all notifications as read
      await markAllNotificationsAsRead(userId)
    }

    return { success: true }
  } catch (error) {
    console.error('Error marking notification(s) as read:', error)
    return {
      success: false,
      error: {
        message: 'Failed to update notification(s)',
        code: 'INVALID_INPUT'
      }
    }
  }
} 