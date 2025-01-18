import { ChatOpenAI } from '@langchain/openai'
import { PineconeStore } from '@langchain/pinecone'
import { OpenAIEmbeddings } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { Pinecone } from '@pinecone-database/pinecone'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { RAG_CONFIG, PROMPT_TEMPLATE } from './config'
import type { RAGServiceDependencies, RAGChainInput, RAGContext } from '@/types/rag'

export class RAGService {
  private pineconeStore: PineconeStore
  private llm: ChatOpenAI
  private chain: RunnableSequence

  constructor(private deps: RAGServiceDependencies) {
    this.pineconeStore = deps.pineconeStore
    this.llm = deps.llm
    this.chain = this.createChain()
  }

  static async initialize() {
    const pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    })

    const embeddings = new OpenAIEmbeddings({
      modelName: RAG_CONFIG.embeddings.modelName,
      dimensions: RAG_CONFIG.embeddings.dimensions
    })

    const pineconeStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: pineconeClient.index(RAG_CONFIG.pinecone.indexName),
      filter: RAG_CONFIG.pinecone.filter
    })

    const llm = new ChatOpenAI({
      modelName: RAG_CONFIG.llm.modelName,
      temperature: RAG_CONFIG.llm.temperature,
      maxTokens: RAG_CONFIG.llm.maxTokens,
      streaming: RAG_CONFIG.llm.streaming
    })

    return new RAGService({
      pineconeStore,
      llm,
      embeddings
    })
  }

  private createChain() {
    const prompt = PromptTemplate.fromTemplate(PROMPT_TEMPLATE)
    
    return RunnableSequence.from([
      {
        context: (input: RAGChainInput) => input.context,
        query: (input: RAGChainInput) => input.query,
        aiUser: (input: RAGChainInput) => input.aiUser,
      },
      prompt,
      this.llm,
      new StringOutputParser()
    ])
  }

  private cleanQuery(query: string, aiUserName: string): string {
    return query.toLowerCase()
      .replace(new RegExp(`\\b${aiUserName.toLowerCase()}\\b`, 'gi'), '')
      .trim()
  }

  async getRelevantContext(query: string): Promise<{ docs: any[], context: string }> {
    const retriever = this.pineconeStore.asRetriever({
      searchType: RAG_CONFIG.retriever.searchType,
      k: RAG_CONFIG.retriever.k
    })

    console.log('[RAG] Querying Pinecone for:', query)
    const docs = await retriever.getRelevantDocuments(query)
    const context = docs.map(doc => doc.pageContent).join('\n\n')

    return { docs, context }
  }

  async generateResponse(query: string, aiUserName: string): Promise<{ response: string, context: RAGContext[] }> {
    const cleanedQuery = this.cleanQuery(query, aiUserName)
    const { docs, context } = await this.getRelevantContext(cleanedQuery)

    console.log('[RAG] Executing chain with query:', cleanedQuery)
    const response = await this.chain.invoke({
      query: cleanedQuery,
      aiUser: aiUserName,
      context
    })
    console.log('[RAG] Chain response:', response)

    const contextData = docs.map(doc => ({
      content: doc.pageContent,
      source: doc.metadata.source,
      score: doc.metadata.score || null,
      type: doc.metadata.type || 'unknown'
    }))

    return { response, context: contextData }
  }
} 