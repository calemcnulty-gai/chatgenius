import type { users } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type DBUser = InferSelectModel<typeof users>

export interface UpdateProfileParams {
  clerkId: string
  name?: string
  displayName?: string | null
  title?: string | null
  timeZone?: string | null
  profileImage?: string | null
}

export interface UserProfile {
  id: string
  name: string
  email: string
  profileImage: string | null
}

export interface UserError {
  message: string
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INVALID_INPUT'
}

export interface UserResponse {
  user: DBUser | UserProfile | null
  error?: UserError
}

export interface UpdateProfileResponse {
  user: DBUser | null
  error?: UserError
} 