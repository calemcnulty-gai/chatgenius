import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { pusherServer } from '@/lib/pusher'
import { getOrCreateUser } from '@/lib/db/users'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the full user data from Clerk
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return new NextResponse('User not found', { status: 404 })
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
      return new NextResponse('Missing required fields', { status: 400 })
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
      const authResponse = pusherServer.authorizeChannel(socketId, channel, {
        user_id: user.id,
        user_info: {
          name: user.name,
          image: user.profileImage,
        },
      })
      return NextResponse.json(authResponse)
    }

    return new NextResponse('Unauthorized channel', { status: 401 })
  } catch (error) {
    console.error('Error authorizing Pusher channel:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 