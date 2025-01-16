import type { workspaces, workspaceMemberships, users, channels, directMessageChannels, directMessageMembers } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'

export type DBWorkspace = InferSelectModel<typeof workspaces>
export type DBWorkspaceMembership = InferSelectModel<typeof workspaceMemberships>
export type DBUser = InferSelectModel<typeof users>
export type DBChannel = InferSelectModel<typeof channels>
export type DBDirectMessageChannel = InferSelectModel<typeof directMessageChannels>
export type DBDirectMessageMember = InferSelectModel<typeof directMessageMembers>

export interface CreateWorkspaceParams {
  name: string
  userId: string
}

export interface CreateChannelParams {
  name: string
  workspaceId: string
  type: DBChannel['type']
}

export interface CreateDMChannelParams {
  workspaceId: string
  memberIds: string[]
}

export interface WorkspaceError {
  message: string
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'INVALID_INPUT'
}

export interface WorkspaceResponse {
  workspace: DBWorkspace | null
  error?: WorkspaceError
}

export interface WorkspacesResponse {
  workspaces: DBWorkspace[]
  error?: WorkspaceError
}

export interface WorkspaceMembershipResponse {
  workspace: DBWorkspace | null
  membership: DBWorkspaceMembership | null
  error?: WorkspaceError
}

export interface WorkspaceUser extends DBUser {
  role: DBWorkspaceMembership['role']
}

export interface WorkspaceUsersResponse {
  users: WorkspaceUser[]
  error?: WorkspaceError
}

export interface ChannelResponse {
  channel: DBChannel | null
  error?: WorkspaceError
}

export interface ChannelsResponse {
  channels: DBChannel[]
  error?: WorkspaceError
}

export interface DMChannelMember extends DBUser {
  unreadCount: number
}

export interface DMChannel extends DBDirectMessageChannel {
  members: DMChannelMember[]
}

export interface DMChannelResponse {
  channel: DMChannel | null
  error?: WorkspaceError
}

export interface DMChannelsResponse {
  channels: DMChannel[]
  error?: WorkspaceError
} 