import type { User } from '@/types/user'
import type { Timestamp } from '@/types/timestamp'

export interface CreateMessageInput {
  channelId: string
  content: string
  parentMessageId?: string | null
  senderId: string
}

export interface MessageData {
  id: string
  content: string
  sender: User
  createdAt: Timestamp
  updatedAt: Timestamp
  parentId: string | null
  replyCount: number
  latestReplyAt: Timestamp | null
  parentMessageId: string | null
  channelId: string | null
  dmChannelId: string | null
  attachments?: {
    files: string[]
  } | null
}

export interface NewMessageEvent {
  id: string
  content: string
  channelId: string
  senderId: string
  senderClerkId: string
  senderName: string
  senderEmail: string
  senderProfileImage: string | null
  senderDisplayName: string | null
  senderTitle: string | null
  senderTimeZone: string | null
  senderCreatedAt: Timestamp
  senderUpdatedAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  parentId: string | null
}

export interface MessageWithSender extends MessageData {
  sender: User
} 