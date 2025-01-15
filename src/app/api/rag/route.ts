import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Pinecone } from '@pinecone-database/pinecone';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';

// Enhanced RAG prompt template
const TEMPLATE = `You are {aiUser}, an AI personality in a chat application.
You should respond in character based on your previous messages and the current query.

Here are some of your previous relevant messages for context:
{context}

Current query: {query}

Please respond in character, maintaining consistency with your previous messages and personality.`;

export async function POST(req: Request) {
    try {
        console.log('[RAG] Received request:', {
            url: req.url,
            method: req.method
        })

        const { userId } = auth();
        if (!userId) {
            console.log('[RAG] Unauthorized request - no userId')
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        console.log('[RAG] Request body:', body)

        const { query, messageId, aiUser, channelId, parentMessageId } = body;

        if (!query) {
            console.log('[RAG] Missing query parameter')
            return new NextResponse('Query is required', { status: 400 });
        }

        if (!aiUser) {
            console.log('[RAG] Missing aiUser parameter')
            return new NextResponse('AI user is required', { status: 400 });
        }

        // Get AI user details from database
        console.log('[RAG] Looking up AI user:', aiUser)
        const aiUserDetails = await db.query.users.findFirst({
            where: eq(users.name, aiUser)
        });

        if (!aiUserDetails) {
            console.log('[RAG] AI user not found:', aiUser)
            return new NextResponse('AI user not found', { status: 404 });
        }

        console.log('[RAG] Found AI user:', {
            id: aiUserDetails.id,
            name: aiUserDetails.name
        })

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

        // Clean the query by removing the AI user's name
        const cleanedQuery = query.toLowerCase()
            .replace(new RegExp(`\\b${aiUserDetails.name.toLowerCase()}\\b`, 'gi'), '')
            .trim();

        // Get context first
        console.log('[RAG] Querying Pinecone for:', cleanedQuery);
        const docs = await retriever.getRelevantDocuments(cleanedQuery);
        const context = docs.map(doc => doc.pageContent).join('\n\n');
        
        // Format and log the actual prompt
        const formattedPrompt = await prompt.format({
            aiUser,
            context,
            query: cleanedQuery
        });
        console.log('[RAG] Formatted prompt:', formattedPrompt);

        // Create processing chain
        const chain = RunnableSequence.from([
            {
                context: async () => context,
                query: () => cleanedQuery,
                aiUser: () => aiUser,
            },
            prompt,
            llm,
            new StringOutputParser()
        ]);

        // Execute chain
        console.log('[RAG] Executing chain with query:', cleanedQuery);
        const response = await chain.invoke({
            query: cleanedQuery,
            aiUser
        });
        console.log('[RAG] Chain response:', response);

        // Create a message from the AI user
        const messageResponse = await fetch(new URL('/api/messages', req.url).toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: response,
                channelId: body.channelId,
                parentMessageId: body.parentMessageId,
                aiUserId: aiUserDetails.id
            }),
        });

        if (!messageResponse.ok) {
            throw new Error('Failed to create AI response message');
        }

        // Log the context documents we already have
        console.log('[RAG] Context documents:', docs.map(doc => ({
            content: doc.pageContent.substring(0, 100) + '...',
            metadata: doc.metadata
        })));

        return NextResponse.json({
            success: true,
            context: docs.map(doc => ({
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