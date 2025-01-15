import { messages } from '@/db/schema'

export interface MessageQueueItem {
  messageId: string
  content: string
  priority: number
  retryCount: number
  createdAt: Date
}

export interface MessageQueue {
  add: (message: Pick<typeof messages.$inferSelect, 'id' | 'content'>) => Promise<void>
  process: () => Promise<void>
  size: () => Promise<number>
}

export interface WorkerConfig {
  batchSize: number
  maxRetries: number
  retryDelay: number // in milliseconds
  pollInterval: number // in milliseconds
} 