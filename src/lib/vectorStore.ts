import { OpenAIEmbeddings } from '@langchain/openai'
import { PineconeStore } from '@langchain/pinecone'
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
})

let vectorStore: PineconeStore | null = null

export async function getVectorStore() {
  if (!vectorStore) {
    const index = pinecone.Index(process.env.PINECONE_INDEX!)
    vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index })
  }
  return vectorStore
}

export async function findSimilarMessages(query: string, k: number = 5) {
  const store = await getVectorStore()
  const results = await store.similaritySearch(query, k)
  
  return results.map(doc => ({
    content: doc.pageContent,
    messageId: doc.metadata.messageId as string,
    createdAt: doc.metadata.createdAt as string,
  }))
} 