import type { invites } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type DBInvite = InferSelectModel<typeof invites>

export interface CreateInviteParams {
  email: string
  workspaceId: string
  inviterId: string
}

export interface AcceptInviteParams {
  token: string
  userId: string
}

export interface InviteError {
  message: string
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INVALID_INPUT' | 'ALREADY_MEMBER'
}

export interface InviteResponse {
  invite: DBInvite | null
  error?: InviteError
}

export interface AcceptInviteResponse {
  success: boolean
  error?: InviteError
} 