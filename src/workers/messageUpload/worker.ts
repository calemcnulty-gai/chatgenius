import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from '@langchain/pinecone'
import { Pinecone } from '@pinecone-database/pinecone'
import { WorkerConfig } from './types'
import { messageQueue } from './queue'

const config: WorkerConfig = {
  batchSize: 10,
  maxRetries: 3,
  retryDelay: 1000,
  pollInterval: 5000,
}

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
})

export class MessageUploadWorker {
  private running = false
  private vectorStore: PineconeStore | null = null

  async initialize() {
    const index = pinecone.Index(process.env.PINECONE_INDEX!)
    this.vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index })
  }

  async start() {
    if (this.running) return
    if (!this.vectorStore) await this.initialize()
    
    this.running = true
    this.processQueue()
  }

  async stop() {
    this.running = false
  }

  private async processQueue() {
    while (this.running) {
      const batch = await messageQueue.getNextBatch(config.batchSize)
      if (batch.length === 0) {
        await new Promise(resolve => setTimeout(resolve, config.pollInterval))
        continue
      }

      try {
        await this.vectorStore!.addDocuments(
          batch.map(item => ({
            pageContent: item.content,
            metadata: {
              messageId: item.messageId,
              createdAt: item.createdAt.toISOString(),
            }
          }))
        )

        // Remove successfully processed messages from queue
        await messageQueue.removeFromQueue(batch.map(item => item.messageId))
      } catch (error) {
        console.error('Error processing message batch:', error)
        
        // Increment retry count for failed messages
        for (const item of batch) {
          if (item.retryCount < config.maxRetries) {
            await messageQueue.incrementRetry(item.messageId)
          } else {
            // Remove messages that have exceeded retry limit
            await messageQueue.removeFromQueue([item.messageId])
            console.error(`Message ${item.messageId} exceeded retry limit`)
          }
        }

        await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      }
    }
  }
}

// Create singleton instance
export const messageUploadWorker = new MessageUploadWorker()

// Helper to ensure worker is running
export async function ensureWorkerRunning() {
  await messageUploadWorker.start()
} 