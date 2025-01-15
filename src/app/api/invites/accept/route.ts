import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { getOrCreateUser } from '@/lib/db/users'
import { acceptInvite } from '@/lib/invites/services/invite'

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

    // Get or create user to get their database ID
    const user = await getOrCreateUser({
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses,
      imageUrl: clerkUser.imageUrl,
    })

    const { token } = await request.json()
    if (!token) {
      return NextResponse.json(
        { error: { message: 'Missing token', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const result = await acceptInvite({
      token,
      userId: user.id,
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { 
          status: result.error.code === 'NOT_FOUND' ? 404 :
                 result.error.code === 'ALREADY_MEMBER' ? 400 : 500 
        }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json(
      { error: { message: 'Failed to accept invite', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 