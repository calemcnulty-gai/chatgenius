import { User } from '@/types/user'
import { workspaces } from '@/db/schema'
import { ChannelWithUnreadCounts, DirectMessageChannelWithUnreadCounts, WorkspaceMembershipWithUser } from '@/types/db'

export interface WorkspaceLayoutData {
  workspace: typeof workspaces.$inferSelect
  channels: ChannelWithUnreadCounts[]
  users: WorkspaceMembershipWithUser[]
  dmChannels: DirectMessageChannelWithUnreadCounts[]
}

export interface ValidationError {
  message: string
  redirect: string
} 