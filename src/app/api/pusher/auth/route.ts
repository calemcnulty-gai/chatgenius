import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { pusherServer } from '@/lib/pusher'
import { getOrCreateUser } from '@/lib/db/users'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  try {
    // Get the full user data from Clerk
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: { message: 'User not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Get or create user to get their database ID
    const user = await getOrCreateUser({
      id: userId,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses,
      imageUrl: clerkUser.imageUrl,
    })

    const data = await req.text()
    const socketId = new URLSearchParams(data).get('socket_id')
    const channel = new URLSearchParams(data).get('channel_name')

    if (!socketId || !channel) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    // Handle presence channel authentication
    if (channel.startsWith('presence-')) {
      const authResponse = pusherServer.authorizeChannel(socketId, channel, {
        user_id: user.id,
        user_info: {
          name: user.name,
          image: user.profileImage,
          status: user.status,
        },
      })
      return NextResponse.json(authResponse)
    }

    // Handle private channel authentication
    if (channel.startsWith('private-') || channel === `user-${user.id}`) {
      const authResponse = pusherServer.authorizeChannel(socketId, channel)
      return NextResponse.json(authResponse)
    }

    return NextResponse.json(
      { error: { message: 'Invalid channel type', code: 'INVALID_INPUT' } },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in Pusher auth:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 