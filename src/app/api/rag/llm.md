# RAG (Retrieval-Augmented Generation) API

This directory contains the API route for ChatGenius's RAG functionality, which enables AI-powered code assistance with context from the codebase.

## Route Overview

### POST /api/rag
Processes queries about the codebase using retrieval-augmented generation.

Request:
```typescript
interface RagRequest {
  query: string  // The user's question about the codebase
}
```

Response:
```typescript
interface RagResponse {
  response: string  // The AI-generated answer
  context: {
    content: string    // The relevant code/documentation
    source: string     // Source file/location
    score: number     // Relevance score
    type: string      // Content type
  }[]
}
```

## Architecture

1. **Authentication**
   - Uses Clerk for user authentication
   - Requires valid user session
   - Returns 401 for unauthorized requests

2. **Vector Store**
   - Pinecone for document storage
   - Namespace-based filtering
   - Hybrid search capabilities
   - Document metadata tracking

3. **Embeddings**
   - OpenAI text-embedding-3-large model
   - 3072-dimensional embeddings
   - Enhanced semantic understanding
   - Optimized for code context

4. **Retrieval System**
   ```typescript
   const retriever = vectorStore.asRetriever({
     searchType: "similarity",
     k: 4,              // Documents to return
     searchKwargs: {
       fetchK: 20,      // Documents to consider
       lambda: 0.7      // Hybrid search balance
     }
   });
   ```

5. **Processing Chain**
   - Document retrieval
   - Context formatting
   - Prompt templating
   - LLM processing
   - Response parsing

## Features

1. **Enhanced Retrieval**
   - Hybrid semantic/keyword search
   - Configurable result count
   - Metadata-based filtering
   - Source tracking
   - Relevance scoring

2. **Advanced LLM Integration**
   - GPT-4 Turbo model
   - Streaming support
   - Controlled temperature
   - Token limit management
   - Error handling

3. **Context Management**
   - Relevant document selection
   - Context formatting
   - Source attribution
   - Score tracking
   - Type identification

## Best Practices

1. **Performance**
   - Efficient retrieval
   - Response streaming
   - Proper error handling
   - Resource management
   - Cache utilization

2. **Security**
   - Authentication checks
   - Input validation
   - Error sanitization
   - Rate limiting
   - Access control

3. **Quality**
   - Clear responses
   - Source references
   - Confidence indicators
   - Missing info handling
   - Follow-up suggestions

## Usage Example

```typescript
// Client-side usage
async function queryCodebase(query: string) {
  const response = await fetch('/api/rag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  const result = await response.json();
  return {
    answer: result.response,
    sources: result.context
  };
}
```

## Error Handling

1. **Client Errors**
   - 400: Missing query
   - 401: Unauthorized
   - 429: Rate limit exceeded

2. **Server Errors**
   - 500: Processing error
   - 503: Service unavailable

3. **Recovery**
   - Detailed error messages
   - Graceful degradation
   - Retry suggestions
   - Alternative options

See route.ts for implementation details. 