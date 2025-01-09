export enum PusherEvent {
  // Message events
  NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE',
  NEW_DIRECT_MESSAGE = 'NEW_DIRECT_MESSAGE',
  MESSAGE_UPDATED = 'MESSAGE_UPDATED',
  MESSAGE_DELETED = 'MESSAGE_DELETED',
  
  // Channel events
  CHANNEL_CREATED = 'CHANNEL_CREATED',
  CHANNEL_UPDATED = 'CHANNEL_UPDATED',
  CHANNEL_DELETED = 'CHANNEL_DELETED',
  
  // User events
  NEW_USER = 'NEW_USER',
  USER_UPDATED = 'USER_UPDATED',
  USER_LEFT = 'USER_LEFT',
  USER_TYPING = 'USER_TYPING',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',

  // Notification events
  NEW_NOTIFICATION = 'NEW_NOTIFICATION',
  NOTIFICATION_READ = 'NOTIFICATION_READ',
  NOTIFICATIONS_CLEARED = 'NOTIFICATIONS_CLEARED'
}

export type BaseMessageEvent = {
  id: string
  content: string
  createdAt: string
  channelId: string
  senderId: string
  senderName: string
  senderProfileImage: string | null
  hasMention: boolean
  isThreadReply: boolean
  parentMessageId?: string | null
}

export type NewChannelMessageEvent = BaseMessageEvent & {
  channelName: string
  workspaceId: string
}

export type NewDirectMessageEvent = BaseMessageEvent & {
  otherUserId: string
}

export type MessageUpdatedEvent = {
  id: string
  content: string
  channelId: string
  updatedAt: string
}

export type NewUserEvent = {
  id: string
  name: string
  profileImage: string | null
  workspaceId: string
  role: 'admin' | 'member'
}

export type UserTypingEvent = {
  channelId: string
  userId: string
  userName: string
}

export type UserStatusEvent = {
  userId: string
  status: 'active' | 'away' | 'offline'
}

export type NotificationEvent = {
  id: string
  type: 'mention' | 'thread_reply' | 'dm'
  title: string
  body?: string
  read: boolean
  createdAt: string
  data: {
    channelId: string
    messageId: string
    senderId: string
    parentMessageId?: string
  }
} 