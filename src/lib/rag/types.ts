import type { User } from '@clerk/nextjs/server'

export interface GenerateRAGResponseParams {
  query: string
  aiUser: string
  messageId?: string
  channelId: string
  parentMessageId?: string | null
  clerkUser: User
}

export interface RAGContext {
  content: string
  source?: string
  score?: number | null
  type?: string
}

export interface RAGResponse {
  success: boolean
  context: RAGContext[]
  message: {
    id: string
    content: string
    channelId: string
    senderId: string
  }
} 