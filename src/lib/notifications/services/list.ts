import { validateLimit } from '../validation'
import { getUserNotifications } from '../queries'
import type { GetNotificationsParams, NotificationsResponse } from '../types'

export async function listNotifications({
  userId,
  limit
}: GetNotificationsParams): Promise<NotificationsResponse> {
  try {
    // Validate and normalize limit
    const validLimit = validateLimit(limit)

    // Get user's notifications
    const notifications = await getUserNotifications(userId, validLimit)

    return { notifications }
  } catch (error) {
    console.error('Error listing notifications:', error)
    return {
      notifications: null,
      error: {
        message: 'Failed to fetch notifications',
        code: 'INVALID_INPUT'
      }
    }
  }
} 