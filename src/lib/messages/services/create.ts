import { messageQueue } from '@/workers/messageUpload/queue'
import { validateAndGetUser, validateAndGetChannel, validateAndGetAIUser } from '../validation'
import { createMessageInDB, updateParentMessageMetadata } from '../queries'
import { triggerMessageEvents, triggerThreadReplyEvent } from '../events'
import { parseAICommand, generateAIResponse } from '@/lib/ai/commands'
import type { User } from '@clerk/nextjs/server'
import type { Channel, DirectMessageChannel } from '@/db/schema'

interface CreateMessageParams {
  clerkUser: User
  channelId: string
  content: string
  parentMessageId?: string | null
}

interface HandleAICommandParams {
  user: {
    id: string
    name: string
    clerkId: string
    email: string
    profileImage: string | null
    displayName: string | null
    title: string | null
    timeZone: string | null
    status: 'offline' | 'active' | 'away'
    lastHeartbeat: string | null
    createdAt: string
    updatedAt: string
  }
  channel: Channel | DirectMessageChannel
  channelType: 'regular' | 'dm'
  content: string
  aiCommand: {
    aiUser: string
  }
}

export async function createMessage({
  clerkUser,
  channelId,
  content,
  parentMessageId
}: CreateMessageParams) {
  // Validate user and get DB user
  const user = await validateAndGetUser(clerkUser)

  // Validate channel
  const { type: channelType, channel } = await validateAndGetChannel(channelId)

  // Check for AI command
  const aiCommand = parseAICommand(content)
  if (aiCommand) {
    return await handleAICommand({
      user: {
        ...user,
        status: 'active' as const
      },
      channel,
      channelType,
      content,
      aiCommand
    })
  }

  // Create regular message
  const message = await createMessageInDB({
    channelId,
    content,
    parentMessageId,
    senderId: user.id
  })

  // Queue for vector embedding
  await messageQueue.add({
    id: message.id,
    content: message.content,
  })

  // Update parent message if this is a reply
  if (parentMessageId) {
    await updateParentMessageMetadata(parentMessageId)
  }

  // Trigger events
  if (channelType === 'regular') {
    await triggerMessageEvents({
      message: {
        ...message,
        sender: {
          ...user,
          status: 'active' as const
        },
        parentId: null,
      },
      workspaceId: channel.workspaceId,
      channelSlug: channel.slug,
      isThreadReply: !!parentMessageId
    })

    if (parentMessageId) {
      await triggerThreadReplyEvent({
        ...message,
        sender: {
          ...user,
          status: 'active' as const
        },
        parentId: null,
      })
    }
  }

  return message
}

async function handleAICommand({ user, channel, channelType, content, aiCommand }: HandleAICommandParams) {
  // Create human message first
  const humanMessage = await createMessageInDB({
    channelId: channel.id,
    content: content.slice(content.indexOf(' ', 4) + 1), // Remove '/ai @username '
    senderId: user.id,
    parentMessageId: null
  })

  // Queue human message for vector embedding
  await messageQueue.add({
    id: humanMessage.id,
    content: humanMessage.content,
  })

  // Get AI user
  const aiUser = await validateAndGetAIUser(aiCommand.aiUser)

  // Generate AI response
  const aiResponse = await generateAIResponse({
    aiUser: aiCommand.aiUser,
    query: humanMessage.content,
    messageId: humanMessage.id
  })

  // Create AI message
  const aiMessage = await createMessageInDB({
    channelId: channel.id,
    content: aiResponse,
    senderId: aiUser.id,
    parentMessageId: null
  })

  // Queue AI message for vector embedding
  await messageQueue.add({
    id: aiMessage.id,
    content: aiMessage.content,
  })

  // Trigger events for AI message
  if (channelType === 'regular') {
    await triggerMessageEvents({
      message: {
        ...aiMessage,
        sender: {
          ...aiUser,
          status: 'active' as const
        },
        parentId: null,
      },
      workspaceId: channel.workspaceId,
      channelSlug: channel.slug,
      isThreadReply: false
    })
  }

  return aiMessage
} 