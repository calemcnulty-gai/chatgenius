import { db } from '@/db'
import { messages } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import type { CreateMessageInput } from './types'
import { now } from '@/types/timestamp'

export async function createMessageInDB(input: CreateMessageInput) {
  const timestamp = now()
  const [message] = await db.insert(messages).values({
    id: uuidv4(),
    channelId: input.channelId,
    dmChannelId: null,
    senderId: input.senderId,
    content: input.content.trim(),
    parentMessageId: input.parentMessageId || null,
    createdAt: timestamp,
    updatedAt: timestamp,
    replyCount: 0,
    latestReplyAt: null,
    editedAt: null,
  }).returning()

  return message
}

export async function updateParentMessageMetadata(parentMessageId: string) {
  const updateTimestamp = now()
  const [updated] = await db.update(messages)
    .set({
      replyCount: sql`${messages.replyCount} + 1`,
      latestReplyAt: updateTimestamp,
      updatedAt: updateTimestamp,
    })
    .where(eq(messages.id, parentMessageId))
    .returning()

  return updated
}

export async function getMessagesForChannel(channelId: string) {
  return await db.query.messages.findMany({
    where: eq(messages.channelId, channelId),
    with: {
      sender: true,
    },
    orderBy: messages.createdAt,
  })
} 