import { InferModel } from 'drizzle-orm'
import * as schema from '@/db/schema'

// Base types from schema
export type User = InferModel<typeof schema.users>
export type Message = InferModel<typeof schema.messages>
export type Channel = InferModel<typeof schema.channels>
export type DirectMessageChannel = InferModel<typeof schema.directMessageChannels>
export type DirectMessageMember = InferModel<typeof schema.directMessageMembers>
export type Workspace = InferModel<typeof schema.workspaces>
export type WorkspaceMembership = InferModel<typeof schema.workspaceMemberships>
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

export interface DirectMessageChannelWithMembers extends DirectMessageChannel {
  members: Array<{
    id: string
    channelId: string
    userId: string
    createdAt: Date
    user: User
  }>
}

export type ChannelWithWorkspace = Channel & {
  workspace: Workspace
} 