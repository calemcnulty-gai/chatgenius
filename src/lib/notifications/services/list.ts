import { validateAndGetUser, validateLimit } from '../validation'
import { getUserNotifications } from '../queries'
import type { GetNotificationsParams, NotificationsResponse } from '../types'

export async function listNotifications({
  clerkUser,
  limit
}: GetNotificationsParams): Promise<NotificationsResponse> {
  try {
    // Get or create user to get their database ID
    const user = await validateAndGetUser(clerkUser)

    // Validate and normalize limit
    const validLimit = validateLimit(limit)

    // Get user's notifications
    const notifications = await getUserNotifications(user.id, validLimit)

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