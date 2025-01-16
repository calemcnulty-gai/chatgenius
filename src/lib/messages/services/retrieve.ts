import { validateAndGetChannel } from '../validation'
import { getMessagesForChannel } from '../queries'
import { getInternalUserId } from '@/lib/auth/services/user'
import type { User } from '@clerk/nextjs/server'
import type { AuthError } from '@/lib/auth/types'

interface GetMessagesParams {
  clerkUser: User
  params: URLSearchParams
}

interface GetMessagesResponse {
  messages: any[]
  hasMore: boolean
  error?: AuthError
}

export async function getMessages({ clerkUser, params }: GetMessagesParams): Promise<GetMessagesResponse> {
  // Get internal user ID
  const { userId, error: authError } = await getInternalUserId(clerkUser)
  if (authError || !userId) {
    return {
      messages: [],
      hasMore: false,
      error: authError || {
        message: 'User not found',
        code: 'NOT_FOUND'
      }
    }
  }

  // Get channelId from query params
  const channelId = params.get('channelId')
  if (!channelId) {
    return {
      messages: [],
      hasMore: false,
      error: {
        message: 'Channel ID is required',
        code: 'INVALID_INPUT'
      }
    }
  }

  // Validate channel
  await validateAndGetChannel(channelId)

  // Get messages
  const messages = await getMessagesForChannel(channelId)

  // Filter out thread replies (messages with parentMessageId)
  const filteredMessages = messages.filter(m => !m.parentMessageId)

  return {
    messages: filteredMessages,
    hasMore: false // Implement pagination later
  }
} 