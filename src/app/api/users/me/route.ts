import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { getProfile, updateProfile } from '@/lib/users/services/profile'

export async function GET() {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const result = await getProfile(userId)
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error.code === 'NOT_FOUND' ? 404 : 500 }
      )
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error('Error getting profile:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = await updateProfile(userId, {
      name: body.name,
      displayName: body.displayName,
      title: body.title,
      timeZone: body.timeZone,
      profileImage: body.profileImage,
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error.code === 'INVALID_INPUT' ? 400 : 500 }
      )
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: { message: 'Invalid request body', code: 'INVALID_INPUT' } },
      { status: 400 }
    )
  }
} 