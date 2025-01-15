# Workers Directory

This directory contains background workers that handle asynchronous tasks for the ChatGenius application. These workers are designed to process tasks that shouldn't block the main application flow.

## Structure

- `messageUpload/` - Handles uploading messages to Pinecone for vector search
  - `queue.ts` - Message queue implementation for handling new messages
  - `worker.ts` - Main worker implementation for processing messages
  - `types.ts` - Type definitions for the message upload worker

## Message Upload Worker

The message upload worker is responsible for:
1. Batch uploading existing messages from the database to Pinecone
2. Processing new messages as they are created
3. Maintaining a queue of messages to be processed
4. Handling retries and error cases

The worker uses Pinecone as the vector store and OpenAI's text-embedding-3-large model for generating embeddings. 