import type { NewMessageEvent } from './events'

export const isNewMessageEvent = (event: any): event is NewMessageEvent =>
  typeof event === 'object' &&
  event !== null &&
  typeof event.id === 'string' &&
  typeof event.content === 'string' &&
  typeof event.channelId === 'string' &&
  typeof event.senderId === 'string' &&
  typeof event.senderClerkId === 'string' &&
  typeof event.senderName === 'string' &&
  typeof event.senderEmail === 'string' &&
  (event.senderProfileImage === null || typeof event.senderProfileImage === 'string') &&
  (event.senderDisplayName === null || typeof event.senderDisplayName === 'string') &&
  (event.senderTitle === null || typeof event.senderTitle === 'string') &&
  (event.senderTimeZone === null || typeof event.senderTimeZone === 'string') &&
  typeof event.createdAt === 'string' &&
  typeof event.updatedAt === 'string' 