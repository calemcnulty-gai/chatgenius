import { validateAndGetUser, validateNotificationAccess } from '../validation'
import { markNotificationAsRead, markAllNotificationsAsRead } from '../queries'
import type { MarkAsReadParams, MarkAsReadResponse } from '../types'

export async function markRead({
  clerkUser,
  notificationId
}: MarkAsReadParams): Promise<MarkAsReadResponse> {
  try {
    // Get or create user to get their database ID
    const user = await validateAndGetUser(clerkUser)

    if (notificationId) {
      // Validate notification access
      const error = await validateNotificationAccess(user.id, notificationId)
      if (error) {
        return { success: false, error }
      }

      // Mark single notification as read
      await markNotificationAsRead(user.id, notificationId)
    } else {
      // Mark all notifications as read
      await markAllNotificationsAsRead(user.id)
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