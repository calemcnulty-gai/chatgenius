import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { listNotifications } from '@/lib/notifications/services/list'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const { notifications, error } = await listNotifications({ userId, limit })

    if (error) {
      return NextResponse.json(
        { error },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 400 }
      )
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: { message: 'Internal Server Error', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 