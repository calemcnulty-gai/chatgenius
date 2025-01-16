import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/middleware';
import { generateRAGResponse } from '@/lib/rag/services/generate';

export async function POST(req: Request) {
    try {
        console.log('[RAG] Received request:', {
            url: req.url,
            method: req.method
        })

        const { userId, error } = await getAuthenticatedUserId();
        if (error || !userId) {
            console.log('[RAG] Unauthorized request:', error?.message || 'no userId')
            return NextResponse.json(
                { error: error || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
                { status: 401 }
            );
        }

        const body = await req.json();
        console.log('[RAG] Request body:', body)

        const { query, messageId, aiUser, channelId, parentMessageId } = body;

        if (!query) {
            console.log('[RAG] Missing query parameter')
            return NextResponse.json(
                { error: { message: 'Query is required', code: 'INVALID_INPUT' } },
                { status: 400 }
            );
        }

        if (!aiUser) {
            console.log('[RAG] Missing aiUser parameter')
            return NextResponse.json(
                { error: { message: 'AI user ID is required', code: 'INVALID_INPUT' } },
                { status: 400 }
            );
        }

        if (!channelId) {
            console.log('[RAG] Missing channelId parameter')
            return NextResponse.json(
                { error: { message: 'Channel ID is required', code: 'INVALID_INPUT' } },
                { status: 400 }
            );
        }

        const response = await generateRAGResponse({
            query,
            aiUserId: aiUser,
            messageId,
            channelId,
            parentMessageId,
            userId
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error('[RAG_ERROR]', error);
        return NextResponse.json(
            { error: { message: error instanceof Error ? error.message : 'Internal Error', code: 'INVALID_INPUT' } },
            { status: 500 }
        );
    }
}