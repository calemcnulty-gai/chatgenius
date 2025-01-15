import type { User } from '@clerk/nextjs/server'
import type { notifications } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type Notification = InferSelectModel<typeof notifications>

export interface GetNotificationsParams {
  clerkUser: User
  limit?: number
}

export interface MarkAsReadParams {
  clerkUser: User
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