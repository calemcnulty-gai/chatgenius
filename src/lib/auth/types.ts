import type { User as ClerkUser } from '@clerk/nextjs/server'
import type { users } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type DBUser = InferSelectModel<typeof users>

export interface SyncUserParams {
  clerkUser: ClerkUser
}

export interface UpdateProfileParams {
  clerkId: string
  displayName?: string | null
  title?: string | null
  timeZone?: string | null
}

export interface ClerkWebhookUser {
  id: string
  first_name: string | null
  last_name: string | null
  image_url: string | null
  email_addresses: Array<{ email_address: string }>
}

export interface AuthError {
  message: string
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INVALID_INPUT'
} 