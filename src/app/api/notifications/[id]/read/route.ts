import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { markRead } from '@/lib/notifications/services/mark-read'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { success, error } = await markRead({ 
      userId,
      notificationId: params.id
    })

    if (error) {
      return NextResponse.json(
        { error },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: { message: 'Internal Server Error', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 