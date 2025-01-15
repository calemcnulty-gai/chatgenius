import { db } from '@/db'
import { messages } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { messageQueue } from './queue'
import { messageUploadWorker } from './worker'

export async function loadExistingMessages() {
  // Get all messages that haven't been processed yet
  const existingMessages = await db
    .select({
      id: messages.id,
      content: messages.content,
    })
    .from(messages)
    .orderBy(messages.createdAt)

  console.log(`Found ${existingMessages.length} messages to process`)

  // Add all messages to the queue
  for (const message of existingMessages) {
    await messageQueue.add(message)
  }

  // Start the worker if it's not already running
  await messageUploadWorker.start()

  return existingMessages.length
} 