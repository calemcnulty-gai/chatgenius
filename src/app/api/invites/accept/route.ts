import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { acceptInvite } from '@/lib/invites/services/invite'

export async function POST(request: Request) {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { token } = await request.json()
    if (!token) {
      return NextResponse.json(
        { error: { message: 'Missing token', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const acceptResult = await acceptInvite({
      token,
      userId,
    })

    if (acceptResult.error) {
      return NextResponse.json(
        { error: acceptResult.error },
        { 
          status: acceptResult.error.code === 'NOT_FOUND' ? 404 :
                 acceptResult.error.code === 'ALREADY_MEMBER' ? 400 : 500 
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