import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { createMessage } from '@/lib/messages/services/create'
import { getMessages } from '@/lib/messages/services/retrieve'

export async function POST(req: Request) {
  try {
    console.log('[MESSAGES] Received POST request:', {
      url: req.url,
      method: req.method
    })

    const { userId } = auth()
    if (!userId) {
      console.log('[MESSAGES] Unauthorized - no userId')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the full user data from Clerk
    const clerkUser = await currentUser()
    if (!clerkUser) {
      console.log('[MESSAGES] User not found - no clerkUser')
      return new NextResponse('User not found', { status: 404 })
    }

    const body = await req.json()
    console.log('[MESSAGES] Request body:', {
      ...body,
      content: body.content?.substring(0, 100) + (body.content?.length > 100 ? '...' : '')
    })

    const message = await createMessage({
      clerkUser,
      ...body
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error in POST /api/messages:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
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