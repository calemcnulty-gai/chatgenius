# RAG (Retrieval-Augmented Generation) Service

This service implements RAG functionality for AI-powered chat responses. It combines context retrieval from Pinecone with OpenAI's language models to generate contextually relevant responses.

## Code Structure

1. `RAGService.ts`: Core service class that:
   - Manages Pinecone and OpenAI integrations
   - Handles context retrieval and response generation
   - Implements the RAG chain using LangChain

2. `generate.ts`: Main entry point that:
   - Coordinates the RAG process
   - Handles message creation and events
   - Manages error cases and API key issues

3. `config.ts`: Configuration for:
   - Pinecone settings
   - OpenAI model parameters
   - Prompt templates
   - Retrieval settings

## Data Flow

1. Query Processing:
   - Clean and prepare the user's query
   - Remove AI user mentions
   
2. Context Retrieval:
   - Search Pinecone for relevant documents
   - Combine documents into context

3. Response Generation:
   - Use LangChain to combine context and query
   - Generate response using OpenAI
   
4. Message Handling:
   - Create message in database
   - Queue for vector embedding
   - Trigger appropriate events

## Error Handling

- Graceful handling of API authentication errors
- Fallback message for API key issues
- Proper error propagation for other cases

## Dependencies

- Pinecone for vector storage
- OpenAI for embeddings and chat
- LangChain for RAG chain orchestration 