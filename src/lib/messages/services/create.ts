import { messageQueue } from '@/workers/messageUpload/queue'
import { validateAndGetChannel } from '../validation'
import { createMessageInDB, updateParentMessageMetadata } from '../queries'
import { triggerMessageEvents, triggerThreadReplyEvent } from '../events'
import { parseAICommand, generateAIResponse } from '@/lib/ai/commands'
import type { channels, directMessageChannels } from '@/db/schema'
import type { InferSelectModel } from 'drizzle-orm'
import type { MessageData } from '../types'
import type { User } from '@/types/user'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

type Channel = InferSelectModel<typeof channels>
type DirectMessageChannel = InferSelectModel<typeof directMessageChannels>

interface CreateMessageParams {
  userId: string
  channelId: string
  content: string
  parentMessageId?: string | null
}

export async function createMessage({
  userId,
  channelId,
  content,
  parentMessageId
}: CreateMessageParams) {
  try {
    // Get user data
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        userAuth: true
      }
    })
    if (!user || !user.userAuth?.[0]) {
      throw new Error('User not found')
    }

    // Get channel info
    const { type: channelType, channel } = await validateAndGetChannel(channelId)

    // Create message
    const dbMessage = await createMessageInDB({
      content,
      channelId,
      senderId: userId,
      parentMessageId
    })

    // Queue for vector embedding
    await messageQueue.add({
      id: dbMessage.id,
      content: dbMessage.content,
    })

    // Create MessageData object
    const message: MessageData = {
      id: dbMessage.id,
      content: dbMessage.content,
      sender: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        displayName: user.displayName,
        title: user.title,
        timeZone: user.timeZone,
        status: user.status as User['status'],
        lastHeartbeat: user.lastHeartbeat,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      createdAt: dbMessage.createdAt,
      updatedAt: dbMessage.updatedAt,
      parentId: null,
      replyCount: dbMessage.replyCount,
      latestReplyAt: dbMessage.latestReplyAt,
      parentMessageId: dbMessage.parentMessageId,
      channelId: dbMessage.channelId,
      dmChannelId: dbMessage.dmChannelId,
    }

    // Trigger events
    await triggerMessageEvents({
      message,
      workspaceId: channel.workspaceId,
      channelSlug: channelType === 'regular' ? (channel as Channel).slug : (channel as DirectMessageChannel).id,
      isThreadReply: !!parentMessageId
    })

    if (parentMessageId) {
      await updateParentMessageMetadata(parentMessageId)
      await triggerThreadReplyEvent(message)
    }

    return message
  } catch (error) {
    console.error('Error creating message:', error)
    throw error
  }
} 