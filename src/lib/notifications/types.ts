import type { notifications } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type Notification = InferSelectModel<typeof notifications>

export interface GetNotificationsParams {
  userId: string
  limit?: number
}

export interface MarkAsReadParams {
  userId: string
  notificationId?: string  // Optional for mark-all
}

export interface NotificationError {
  message: string
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INVALID_INPUT'
}

export interface NotificationsResponse {
  notifications: Notification[] | null
  error?: NotificationError
}

export interface MarkAsReadResponse {
  success: boolean
  error?: NotificationError
} 