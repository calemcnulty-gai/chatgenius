import { Message } from '@/types/db'
import { User } from '@/types/user'
import { PineconeStore } from '@langchain/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { ChatOpenAI } from '@langchain/openai'

export interface GenerateRAGResponseParams {
  query: string
  aiUserId: string
  messageId: string
  channelId: string
  parentMessageId?: string | null
  userId: string
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

export interface RAGContext {
  content: string
  source: string
  score: number | null
  type: string
}

export interface RAGServiceDependencies {
  pineconeStore: PineconeStore
  embeddings: OpenAIEmbeddings
  llm: ChatOpenAI
}

export interface RAGChainInput {
  query: string
  aiUser: string
  context: string
}

export interface MessageEventData {
  message: Message & {
    sender: User
    parentId: string | null
    attachments: any | null
  }
  workspaceId: string
  channelSlug: string
  isThreadReply: boolean
} 