import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { listNotifications } from '@/lib/notifications/services/list'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the full user data from Clerk
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get limit from query params
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined

    const { notifications, error } = await listNotifications({ clerkUser, limit })

    if (error) {
      return new NextResponse(error.message, { 
        status: error.code === 'UNAUTHORIZED' ? 401 : 400 
      })
    }

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 