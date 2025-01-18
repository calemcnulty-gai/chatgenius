import { pusher } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'
import { db } from '@/db'
import { workspaceMemberships } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { MessageData } from './types'
import { now } from '@/types/timestamp'

interface TriggerMessageEventsParams {
  message: MessageData
  workspaceId: string
  channelSlug?: string
  isThreadReply?: boolean
}

export async function triggerMessageEvents({
  message,
  workspaceId,
  channelSlug,
  isThreadReply = false
}: TriggerMessageEventsParams) {
  // Get all workspace members
  const workspaceMembers = await db.query.workspaceMemberships.findMany({
    where: eq(workspaceMemberships.workspaceId, workspaceId),
  })

  // Send the message to each member's user channel
  for (const member of workspaceMembers) {
    console.log('[API] Triggering message event:', {
      channel: `user-${member.userId}`,
      event: PusherEvent.NEW_CHANNEL_MESSAGE,
      messageId: message.id,
      channelId: message.channelId,
      senderId: message.sender.id,
      recipientId: member.userId
    })
    
    await pusher.trigger(`user-${member.userId}`, PusherEvent.NEW_CHANNEL_MESSAGE, {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      channelId: message.channelId,
      channelSlug: channelSlug || '',
      channelName: channelSlug || '',
      workspaceId,
      senderId: message.sender.id,
      senderName: message.sender.name,
      senderEmail: message.sender.email,
      senderProfileImage: message.sender.profileImage,
      senderDisplayName: message.sender.displayName,
      senderTitle: message.sender.title,
      senderTimeZone: message.sender.timeZone,
      senderCreatedAt: message.sender.createdAt,
      senderUpdatedAt: message.sender.updatedAt,
      parentId: null,
      parentMessageId: null,
      hasMention: false,
      isThreadReply
    })
  }
}

export async function triggerThreadReplyEvent(message: MessageData) {
  if (!message.parentMessageId) return

  // Get all workspace members and trigger thread-specific event
  const workspaceMembers = await db.query.workspaceMemberships.findMany({
    where: eq(workspaceMemberships.workspaceId, message.channelId!)
  })

  for (const member of workspaceMembers) {
    await pusher.trigger(`user-${member.userId}`, PusherEvent.NEW_THREAD_REPLY, {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      channelId: message.channelId,
      channelSlug: '',
      channelName: 'thread-reply',
      senderId: message.sender.id,
      senderName: message.sender.name,
      senderEmail: message.sender.email,
      senderProfileImage: message.sender.profileImage,
      senderDisplayName: message.sender.displayName,
      senderTitle: message.sender.title,
      senderTimeZone: message.sender.timeZone,
      senderCreatedAt: message.sender.createdAt,
      senderUpdatedAt: message.sender.updatedAt,
      parentId: message.parentMessageId,
      parentMessageId: message.parentMessageId
    })
  }
} 