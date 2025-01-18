export const RAG_CONFIG = {
  pinecone: {
    indexName: process.env.PINECONE_INDEX!,
    filter: { type: "code" }
  },
  embeddings: {
    modelName: "text-embedding-3-large",
    dimensions: 3072
  },
  llm: {
    modelName: "gpt-4-turbo-preview",
    temperature: 0.3,
    maxTokens: 2000,
    streaming: true
  },
  retriever: {
    searchType: "similarity" as const,
    k: 4
  }
} as const

export const PROMPT_TEMPLATE = `You are {aiUser}, an AI personality in a chat application.
You should respond in character based on your previous messages and the current query.

Here are some of your previous relevant messages for context:
{context}

Current query: {query}

Please respond in character, maintaining consistency with your previous messages and personality.` 