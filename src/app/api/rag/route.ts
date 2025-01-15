import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Pinecone } from '@pinecone-database/pinecone';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Enhanced RAG prompt template
const TEMPLATE = `You are {aiUser}, an AI personality in a chat application.
You should respond in character based on your previous messages and the current query.

Here are some of your previous relevant messages for context:
{context}

Current query: {query}

Please respond in character, maintaining consistency with your previous messages and personality.`;

export async function POST(req: Request) {
    try {
        const { userId } = auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { query, messageId } = body;

        if (!query) {
            return new NextResponse('Query is required', { status: 400 });
        }

        console.log('[RAG] Processing query:', query);

        // Initialize Pinecone
        const pc = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!
        });

        const index = pc.index(process.env.PINECONE_INDEX!);

        // Initialize embeddings with enhanced model
        const embeddings = new OpenAIEmbeddings({
            modelName: "text-embedding-3-large",
            dimensions: 3072
        });

        // Initialize vector store with metadata filtering
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            filter: { type: "code" }
        });

        // Create enhanced retriever with hybrid search
        const retriever = vectorStore.asRetriever({
            searchType: "similarity",
            k: 4 // Number of documents to retrieve
        });

        // Create prompt
        const prompt = PromptTemplate.fromTemplate(TEMPLATE);

        // Initialize LLM with specific configuration
        const llm = new ChatOpenAI({
            modelName: "gpt-4-turbo-preview",
            temperature: 0.3, // Lower temperature for more focused responses
            maxTokens: 2000,
            streaming: true
        });

        // Create processing chain
        const chain = RunnableSequence.from([
            {
                context: async () => {
                    console.log('[RAG] Querying Pinecone for:', query);
                    const docs = await retriever.getRelevantDocuments(query);
                    console.log('[RAG] Pinecone returned documents:', docs.map(doc => ({
                        content: doc.pageContent.substring(0, 100) + '...',
                        metadata: doc.metadata
                    })));
                    return docs.map(doc => doc.pageContent).join('\n\n');
                },
                query: (input: { query: string }) => input.query,
            },
            prompt,
            llm,
            new StringOutputParser()
        ]);

        // Execute chain
        console.log('[RAG] Executing chain with query:', query);
        const response = await chain.invoke({ query });
        console.log('[RAG] Chain response:', response);

        // Get context for response
        console.log('[RAG] Getting additional context from Pinecone');
        const context = await retriever.getRelevantDocuments(query);
        console.log('[RAG] Additional context documents:', context.map(doc => ({
            content: doc.pageContent.substring(0, 100) + '...',
            metadata: doc.metadata
        })));

        return NextResponse.json({
            response,
            context: context.map(doc => ({
                content: doc.pageContent,
                source: doc.metadata.source,
                score: doc.metadata.score || null,
                type: doc.metadata.type || 'unknown'
            }))
        });

    } catch (error) {
        console.error('[RAG_ERROR]', error);
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse('Internal Error', { status: 500 });
    }
}