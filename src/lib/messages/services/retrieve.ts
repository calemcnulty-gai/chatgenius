import { validateAndGetUser, validateAndGetChannel } from '../validation'
import { getMessagesForChannel } from '../queries'
import type { User } from '@clerk/nextjs/server'

interface GetMessagesParams {
  clerkUser: User
  params: URLSearchParams
}

export async function getMessages({ clerkUser, params }: GetMessagesParams) {
  // Validate user and get DB user
  const user = await validateAndGetUser(clerkUser)

  // Get channelId from query params
  const channelId = params.get('channelId')
  if (!channelId) {
    throw new Error('Channel ID is required')
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