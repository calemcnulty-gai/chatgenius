import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { uploadProfilePhoto, removeProfilePhoto } from '@/lib/users/services/profile-photo'

export async function POST(request: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json(
        { error: { message: 'No file provided', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const result = await uploadProfilePhoto({ id: userId } as any, file)
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error.code === 'INVALID_INPUT' ? 400 : 500 }
      )
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    return NextResponse.json(
      { error: { message: 'Failed to upload profile photo', code: 'INVALID_INPUT' } },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  const result = await removeProfilePhoto({ id: userId } as any)
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.code === 'INVALID_INPUT' ? 400 : 500 }
    )
  }

  return NextResponse.json({ user: result.user })
} 