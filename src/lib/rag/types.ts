export interface GenerateRAGResponseParams {
  query: string
  aiUserId: string
  messageId?: string
  channelId: string
  parentMessageId?: string | null
  userId: string
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