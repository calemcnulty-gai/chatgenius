import type { User } from '@clerk/nextjs/server'
import type { channels } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type Channel = InferSelectModel<typeof channels>

export type ChannelType = 'public' | 'private'

export interface CreateChannelParams {
  name: string
  workspaceId: string
  type?: ChannelType
  clerkUser: User
}

export interface GetChannelsParams {
  workspaceId: string
  clerkUser: User
}

export interface ChannelValidationError {
  message: string
  code: 'UNAUTHORIZED' | 'INVALID_INPUT' | 'NOT_FOUND'
} 