import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { ChatOpenAI } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Pinecone } from '@pinecone-database/pinecone';

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

        // Initialize embeddings
        const embeddings = new OpenAIEmbeddings({
            modelName: "text-embedding-3-large"
        });

        // Initialize vector store
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
        });

        // Search for relevant documents
        const retriever = vectorStore.asRetriever();
        const context = await retriever.getRelevantDocuments(query);

        // Create prompt with context
        const template = PromptTemplate.fromTemplate(
            "{query}\n\nContext: {context}"
        );
        const promptWithContext = await template.format({
            query,
            context: context.map(doc => doc.pageContent).join('\n\n')
        });

        // Get response from LLM
        const llm = new ChatOpenAI({
            modelName: "gpt-4",
            temperature: 0.7,
        });

        const response = await llm.invoke(promptWithContext);

        return NextResponse.json({
            response: response.content,
            context: context.map(doc => ({
                content: doc.pageContent,
                source: doc.metadata.source
            }))
        });

    } catch (error) {
        console.error('[RAG_ERROR]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
} 