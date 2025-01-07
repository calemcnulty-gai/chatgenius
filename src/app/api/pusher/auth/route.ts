import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { pusherServer } from '@/lib/pusher'

export async function POST(request: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = await request.text()
    const [socketId, channelName] = data
      .split('&')
      .map(pair => pair.split('=')[1])

    // Authorize the channel
    const authResponse = pusherServer.authorizeChannel(
      socketId,
      channelName,
      {
        user_id: userId,
      }
    )

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('Error in Pusher auth:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 