# RAG (Retrieval Augmented Generation) API

This directory contains the API endpoint for RAG functionality in ChatGenius.

## Overview

The RAG endpoint (`/api/rag`) provides AI-powered responses by:
1. Retrieving relevant documents from Pinecone vector store
2. Using the retrieved context to generate informed responses via GPT-4
3. Returning both the AI response and source documents

## Usage

Users can access this functionality through the `/ai` chat command:
```
/ai What is the revenue growth for Q3?
```

## Environment Variables Required

- `PINECONE_API_KEY`: API key for Pinecone vector database
- `PINECONE_INDEX`: Name of the Pinecone index to query
- `OPENAI_API_KEY`: API key for OpenAI (used for embeddings and chat completion)

## Technical Details

- Uses LangChain for RAG pipeline orchestration
- Embeddings: OpenAI text-embedding-3-large
- LLM: GPT-4 with temperature 0.7
- Vector Store: Pinecone for document retrieval 