import { InferModel } from 'drizzle-orm'
import * as schema from '@/db/schema'

// Base types from schema
export type User = InferModel<typeof schema.users>
export type Message = InferModel<typeof schema.messages>
export type Channel = Omit<InferModel<typeof schema.channels>, 'type'> & {
  type: 'public' | 'private'
}
export type DirectMessageChannel = InferModel<typeof schema.directMessageChannels>
export type DirectMessageMember = InferModel<typeof schema.directMessageMembers>
export type Workspace = InferModel<typeof schema.workspaces>
export type WorkspaceMembership = InferModel<typeof schema.workspaceMemberships>
export type WorkspaceMembershipWithUser = WorkspaceMembership & {
  user: User
}
export type Notification = InferModel<typeof schema.notifications>
export type UnreadMessage = InferModel<typeof schema.unreadMessages>

// Types with relations
export type MessageWithSender = Message & {
  sender: User
}

export type MessageWithThread = MessageWithSender & {
  replies?: MessageWithSender[]
  replyCount: number
  latestReplyAt?: Date
}

export type DirectMessageChannelWithMembers = DirectMessageChannel & {
  members: Array<{
    id: string
    channelId: string
    userId: string
    createdAt: Date
    user: User
  }>
}

export type DirectMessageChannelWithUnreadMessages = DirectMessageChannelWithMembers & {
  unreadMessages: UnreadMessage[]
}

export type DirectMessageChannelWithUnreadCounts = DirectMessageChannel & {
  otherUser: {
    id: string
    name: string | null
    profileImage: string | null
    status: 'active' | 'away' | 'offline'
  }
  unreadCount: number
  hasMention: boolean
}

export type ChannelWithWorkspace = Channel & {
  workspace: Workspace
}

export type ChannelWithUnreadMessages = Channel & {
  unreadMessages: UnreadMessage[]
}

export type ChannelWithUnreadCounts = Channel & {
  unreadCount: number
  hasMention: boolean
} 