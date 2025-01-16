import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { createMessage } from '@/lib/messages/services/create'
import { getMessages } from '@/lib/messages/services/retrieve'

export async function POST(request: Request) {
  try {
    const { userId, error } = await getAuthenticatedUserId()
    if (error || !userId) {
      return NextResponse.json(
        { error: error || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { channelId, content, parentMessageId } = await request.json()
    if (!channelId || !content) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const message = await createMessage({
      userId,
      channelId,
      content,
      parentMessageId
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error in POST /api/messages:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { userId, error } = await getAuthenticatedUserId()
    if (error || !userId) {
      return NextResponse.json(
        { error: error || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const messages = await getMessages({
      userId,
      params: searchParams
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error in GET /api/messages:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 