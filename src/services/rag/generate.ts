import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateAndGetChannel } from '@/lib/messages/validation'
import { createMessageInDB } from '@/lib/messages/queries'
import { triggerMessageEvents, triggerThreadReplyEvent } from '@/lib/messages/events'
import { messageQueue } from '@/workers/messageUpload/queue'
import { RAGService } from './RAGService'
import type { GenerateRAGResponseParams, RAGResponse } from '@/types/rag'

let ragService: RAGService | null = null

async function getRagService() {
  if (!ragService) {
    ragService = await RAGService.initialize()
  }
  return ragService
}

export async function generateRAGResponse({
  query,
  aiUserId,
  messageId,
  channelId,
  parentMessageId,
}: GenerateRAGResponseParams): Promise<RAGResponse> {
  try {
    // Get AI user
    const aiUser = await db.query.users.findFirst({
      where: eq(users.id, aiUserId)
    })

    if (!aiUser) throw new Error('AI user not found')

    // Get RAG response
    const service = await getRagService()
    const { response, context } = await service.generateResponse(query, aiUser.name)

    // Create message from AI user
    const message = await createMessageInDB({
      channelId,
      content: response,
      parentMessageId,
      senderId: aiUser.id
    })

    // Queue for vector embedding
    await messageQueue.add({
      id: message.id,
      content: message.content,
    })

    // Get channel info for events
    const { type: channelType, channel } = await validateAndGetChannel(channelId)

    // Trigger events
    if (channelType === 'regular') {
      await triggerMessageEvents({
        message: {
          ...message,
          sender: {
            ...aiUser,
            status: 'active' as const
          },
          parentId: null,
          attachments: null
        },
        workspaceId: channel.workspaceId,
        channelSlug: channel.slug,
        isThreadReply: !!parentMessageId
      })

      if (parentMessageId) {
        await triggerThreadReplyEvent({
          ...message,
          sender: {
            ...aiUser,
            status: 'active' as const
          },
          parentId: null,
          attachments: null
        })
      }
    }

    return {
      success: true,
      context,
      message: {
        id: message.id,
        content: message.content,
        channelId: message.channelId!,
        senderId: message.senderId
      }
    }
  } catch (error) {
    // Check for auth errors (401 unauthorized or 403 forbidden)
    const isAuthError = error instanceof Error && 
      (error.message.includes('401') || 
       error.message.includes('403') ||
       (error as any).status === 401 || 
       (error as any).status === 403 ||
       (error as any).statusCode === 401 ||
       (error as any).statusCode === 403);

    if (isAuthError) {
      const message = await createMessageInDB({
        channelId,
        content: "Someone leaked the OpenAI key again",
        parentMessageId,
        senderId: aiUserId
      })

      return {
        success: true,
        context: [],
        message: {
          id: message.id,
          content: message.content,
          channelId: message.channelId!,
          senderId: message.senderId
        }
      }
    }
    throw error;
  }
} 