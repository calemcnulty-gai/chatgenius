import { InferModel } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { Timestamp } from './timestamp'

// Base types from schema
export type User = Omit<InferModel<typeof schema.users>, 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type Message = Omit<InferModel<typeof schema.messages>, 'createdAt' | 'editedAt' | 'latestReplyAt'> & {
  createdAt: Timestamp
  editedAt: Timestamp | null
  latestReplyAt: Timestamp | null
}

export type Channel = Omit<InferModel<typeof schema.channels>, 'type' | 'createdAt' | 'updatedAt'> & {
  type: 'public' | 'private'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type DirectMessageChannel = Omit<InferModel<typeof schema.directMessageChannels>, 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type DirectMessageMember = Omit<InferModel<typeof schema.directMessageMembers>, 'createdAt'> & {
  createdAt: Timestamp
}

export type Workspace = Omit<InferModel<typeof schema.workspaces>, 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type WorkspaceMembership = Omit<InferModel<typeof schema.workspaceMemberships>, 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type WorkspaceMembershipWithUser = WorkspaceMembership & {
  user: User
}

export type Notification = Omit<InferModel<typeof schema.notifications>, 'createdAt'> & {
  createdAt: Timestamp
}

export type UnreadMessage = Omit<InferModel<typeof schema.unreadMessages>, 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Types with relations
export type MessageWithSender = Message & {
  sender: User
}

export type MessageWithThread = MessageWithSender & {
  replies?: MessageWithSender[]
  replyCount: number
  latestReplyAt?: Timestamp
}

export type DirectMessageChannelMember = {
  id: string
  name: string
  email: string
  profileImage: string | null
  unreadCount: number
  status?: 'active' | 'away' | 'offline'
}

export type DirectMessageChannelWithMembers = DirectMessageChannel & {
  members: DirectMessageChannelMember[]
}

export type DirectMessageChannelWithUnreadMessages = DirectMessageChannelWithMembers & {
  unreadMessages: UnreadMessage[]
}

// Deprecated - use DirectMessageChannelWithMembers instead
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