import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { markRead } from '@/lib/notifications/services/mark-read'

export async function POST() {
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

    const { success, error } = await markRead({ clerkUser })

    if (error) {
      return new NextResponse(error.message, { 
        status: error.code === 'UNAUTHORIZED' ? 401 : 400 
      })
    }

    return new NextResponse('OK')
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 