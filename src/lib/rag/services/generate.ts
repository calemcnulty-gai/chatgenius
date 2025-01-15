import { ChatOpenAI } from '@langchain/openai'
import { PineconeStore } from '@langchain/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { Pinecone } from '@pinecone-database/pinecone'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { validateAndGetChannel } from '@/lib/messages/validation'
import { createMessageInDB } from '@/lib/messages/queries'
import { triggerMessageEvents, triggerThreadReplyEvent } from '@/lib/messages/events'
import { messageQueue } from '@/workers/messageUpload/queue'
import type { GenerateRAGResponseParams, RAGResponse } from '../types'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const TEMPLATE = `You are {aiUser}, an AI personality in a chat application.
You should respond in character based on your previous messages and the current query.

Here are some of your previous relevant messages for context:
{context}

Current query: {query}

Please respond in character, maintaining consistency with your previous messages and personality.`

export async function generateRAGResponse({
  query,
  aiUserId,
  messageId,
  channelId,
  parentMessageId,
  clerkUser
}: GenerateRAGResponseParams): Promise<RAGResponse> {
  // Get AI user
  const aiUser = await db.query.users.findFirst({
    where: eq(users.id, aiUserId)
  })

  if (!aiUser) throw new Error('AI user not found')

  // Initialize Pinecone
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!
  })

  const index = pc.index(process.env.PINECONE_INDEX!)

  // Initialize embeddings
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-large",
    dimensions: 3072
  })

  // Initialize vector store
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
    filter: { type: "code" }
  })

  // Create retriever
  const retriever = vectorStore.asRetriever({
    searchType: "similarity",
    k: 4
  })

  // Create prompt
  const prompt = PromptTemplate.fromTemplate(TEMPLATE)

  // Initialize LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0.3,
    maxTokens: 2000,
    streaming: true
  })

  // Clean query
  const cleanedQuery = query.toLowerCase()
    .replace(new RegExp(`\\b${aiUser.name.toLowerCase()}\\b`, 'gi'), '')
    .trim()

  // Get context
  console.log('[RAG] Querying Pinecone for:', cleanedQuery)
  const docs = await retriever.getRelevantDocuments(cleanedQuery)
  const context = docs.map(doc => doc.pageContent).join('\n\n')

  // Create chain
  const chain = RunnableSequence.from([
    {
      context: async () => context,
      query: () => cleanedQuery,
      aiUser: () => aiUser.name,
    },
    prompt,
    llm,
    new StringOutputParser()
  ])

  // Execute chain
  console.log('[RAG] Executing chain with query:', cleanedQuery)
  const response = await chain.invoke({
    query: cleanedQuery,
    aiUser: aiUser.name
  })
  console.log('[RAG] Chain response:', response)

  // Create message from AI user
  const message = await createMessageInDB({
    channelId,
    content: response,
    parentMessageId,
    senderId: aiUser.id
  })

  // Queue for vector embedding
  await messageQueue.add({
    id: message.id,
    content: message.content,
  })

  // Get channel info for events
  const { type: channelType, channel } = await validateAndGetChannel(channelId)

  // Trigger events
  if (channelType === 'regular') {
    await triggerMessageEvents({
      message: {
        ...message,
        sender: {
          ...aiUser,
          status: 'active' as const
        },
        parentId: null,
        attachments: null
      },
      workspaceId: channel.workspaceId,
      channelSlug: channel.slug,
      isThreadReply: !!parentMessageId
    })

    if (parentMessageId) {
      await triggerThreadReplyEvent({
        ...message,
        sender: {
          ...aiUser,
          status: 'active' as const
        },
        parentId: null,
        attachments: null
      })
    }
  }

  return {
    success: true,
    context: docs.map(doc => ({
      content: doc.pageContent,
      source: doc.metadata.source,
      score: doc.metadata.score || null,
      type: doc.metadata.type || 'unknown'
    })),
    message: {
      id: message.id,
      content: message.content,
      channelId: message.channelId!,
      senderId: message.senderId
    }
  }
} 