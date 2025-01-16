import { Timestamp } from './timestamp'

export enum PusherEvent {
  NEW_CHANNEL_MESSAGE = 'new-channel-message',
  NEW_DIRECT_MESSAGE = 'new-direct-message',
  NEW_THREAD_REPLY = 'new-thread-reply',
  NEW_MENTION = 'new-mention',
  CHANNEL_CREATED = 'channel-created',
  CHANNEL_UPDATED = 'channel-updated',
  CHANNEL_DELETED = 'channel-deleted',
  USER_STATUS_CHANGED = 'user-status-changed',
  MESSAGE_UPDATED = 'message-updated',
}

export interface BaseMessageEvent {
  id: string
  content: string
  channelId: string
  channelSlug: string
  channelName: string
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
  parentMessageId: string | null
}

export interface NewChannelMessageEvent extends BaseMessageEvent {}
export interface NewDirectMessageEvent extends BaseMessageEvent {}
export interface NewThreadReplyEvent extends BaseMessageEvent {}

export interface NewMentionEvent {
  id: string
  channelId: string
  channelSlug: string
  channelName: string
  messageId: string
  userId: string
  createdAt: Timestamp
}

export interface MessageUpdatedEvent {
  id: string
  replyCount: number
  latestReplyAt: Timestamp
  updatedAt: Timestamp
} 