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
const TEMPLATE = `You are an AI assistant helping with questions about a codebase.
Use the following context to answer the question. If you don't know the answer, 
just say you don't know. Don't try to make up an answer.

Context: {context}

Question: {query}

Please provide a clear and concise answer, referencing specific parts of the code when relevant.
If the context doesn't contain enough information to fully answer the question, mention what
additional information would be helpful.

Answer:`;

export async function POST(req: Request) {
    try {
        const { userId } = auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { query } = body;

        if (!query) {
            return new NextResponse('Query is required', { status: 400 });
        }

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
            filter: { namespace: "code" } // Adjust namespace as needed
        });

        // Create enhanced retriever with hybrid search
        const retriever = vectorStore.asRetriever({
            searchType: "similarity",
            k: 4, // Number of documents to retrieve
            filter: { namespace: "code" } // Adjust namespace as needed
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
                    const docs = await retriever.getRelevantDocuments(query);
                    return docs.map(doc => doc.pageContent).join('\n\n');
                },
                query: (input: { query: string }) => input.query,
            },
            prompt,
            llm,
            new StringOutputParser()
        ]);

        // Execute chain
        const response = await chain.invoke({ query });

        // Get context for response
        const context = await retriever.getRelevantDocuments(query);

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