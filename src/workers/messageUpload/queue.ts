import { messages } from '@/db/schema'
import { MessageQueue, MessageQueueItem } from './types'
import { db } from '@/db'

class InMemoryMessageQueue implements MessageQueue {
  private queue: MessageQueueItem[] = []
  private processing = false

  async add(message: Pick<typeof messages.$inferSelect, 'id' | 'content'>) {
    this.queue.push({
      messageId: message.id,
      content: message.content,
      priority: 1,
      retryCount: 0,
      createdAt: new Date()
    })
  }

  async process() {
    if (this.processing) {
      return
    }
    this.processing = true
    // Processing will be implemented in the worker
  }

  async size() {
    return this.queue.length
  }

  // Internal methods used by the worker
  async getNextBatch(batchSize: number): Promise<MessageQueueItem[]> {
    return this.queue
      .sort((a, b) => b.priority - a.priority)
      .slice(0, batchSize)
  }

  async removeFromQueue(messageIds: string[]) {
    this.queue = this.queue.filter(item => !messageIds.includes(item.messageId))
  }

  async incrementRetry(messageId: string) {
    const item = this.queue.find(item => item.messageId === messageId)
    if (item) {
      item.retryCount++
      item.priority -= 1 // Lower priority for retries
    }
  }
}

// Singleton instance
export const messageQueue = new InMemoryMessageQueue()

// Helper to add new messages to the queue
export async function queueMessage(message: Pick<typeof messages.$inferSelect, 'id' | 'content'>) {
  await messageQueue.add(message)
} 