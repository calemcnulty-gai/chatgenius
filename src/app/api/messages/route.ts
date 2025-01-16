import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { createMessage } from '@/lib/messages/services/create'
import { getInternalUserId } from '@/lib/auth/services/user'

export async function POST(request: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: { message: 'User not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    const { channelId, content, parentMessageId } = await request.json()
    if (!channelId || !content) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const result = await getInternalUserId(clerkUser)
    if (result.error || !result.userId) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.code === 'NOT_FOUND' ? 404 : 400 }
      )
    }

    const message = await createMessage({
      userId: result.userId,
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
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const messages = await getMessages({
      clerkUser,
      params: searchParams
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error in GET /api/messages:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 