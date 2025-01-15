import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { syncUser } from '@/lib/auth/services/sync'

// Force Node.js runtime
export const runtime = 'nodejs'

export async function POST() {
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

    const { user, error } = await syncUser({ clerkUser })
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 400 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error in sync route:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 