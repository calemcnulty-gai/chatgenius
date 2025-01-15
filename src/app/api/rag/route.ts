import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs';
import { generateRAGResponse } from '@/lib/rag/services/generate';

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

        // Get the full user data from Clerk
        const clerkUser = await currentUser();
        if (!clerkUser) {
            console.log('[RAG] User not found - no clerkUser')
            return new NextResponse('User not found', { status: 404 });
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
            return new NextResponse('AI user ID is required', { status: 400 });
        }

        if (!channelId) {
            console.log('[RAG] Missing channelId parameter')
            return new NextResponse('Channel ID is required', { status: 400 });
        }

        const response = await generateRAGResponse({
            query,
            aiUserId: aiUser,
            messageId,
            channelId,
            parentMessageId,
            clerkUser
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error('[RAG_ERROR]', error);
        if (error instanceof Error) {
            return new NextResponse(error.message, { status: 500 });
        }
        return new NextResponse('Internal Error', { status: 500 });
    }
}