import type { channels } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type Channel = InferSelectModel<typeof channels>

export type ChannelType = 'public' | 'private'

export interface CreateChannelParams {
  userId: string
  name: string
  workspaceId: string
  type?: ChannelType
}

export interface GetChannelsParams {
  userId: string
  workspaceId: string
}

export interface ChannelValidationError {
  message: string
  code: 'UNAUTHORIZED' | 'INVALID_INPUT' | 'NOT_FOUND'
} 