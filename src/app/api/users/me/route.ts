import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { getProfile, updateProfile } from '@/lib/users/services/profile'

export async function GET() {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  const result = await getProfile({ id: userId } as any)
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.code === 'NOT_FOUND' ? 404 : 500 }
    )
  }

  return NextResponse.json({ user: result.user })
}

export async function PATCH(request: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const result = await updateProfile({ id: userId } as any, {
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