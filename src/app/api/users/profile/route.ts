import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { updateProfile } from '@/lib/users/services/profile'

export async function PUT(request: Request) {
  try {
    const { userId, error } = await getAuthenticatedUserId()
    if (error || !userId) {
      return NextResponse.json(
        { error: error || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = await updateProfile(userId, {
      displayName: body.displayName,
      title: body.title,
      timeZone: body.timeZone,
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error.code === 'INVALID_INPUT' ? 400 : 500 }
      )
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: { message: 'Invalid request body', code: 'INVALID_INPUT' } },
      { status: 400 }
    )
  }
} 