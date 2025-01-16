import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { findUserByClerkId } from './queries'
import { syncUser } from './services/sync'

export async function withUser(request: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  try {
    // First try to find the user in our database
    const dbUser = await findUserByClerkId(userId)
    
    // If we don't find the user, or if it's been more than 1 hour since last sync,
    // sync with Clerk's data
    if (!dbUser || shouldSync(dbUser.updatedAt)) {
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json(
          { error: { message: 'User not found', code: 'NOT_FOUND' } },
          { status: 404 }
        )
      }

      const { user, error } = await syncUser({ clerkUser })
      if (error || !user) {
        return { userId: null, error: error || { message: 'User not found', code: 'NOT_FOUND' } }
      }

      // Attach the synced user to the request
      request.user = user
    } else {
      // Attach the existing user to the request
      request.user = dbUser
    }

    return NextResponse.next()
  } catch (error) {
    console.error('Error in withUser middleware:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

// Helper to determine if we should sync with Clerk
// Returns true if the user was last synced more than 1 hour ago
function shouldSync(lastSyncTime: string): boolean {
  const lastSync = new Date(lastSyncTime)
  const now = new Date()
  const hoursSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
  return hoursSinceLastSync > 1
}

// Extend the NextRequest type to include our user
declare module 'next/server' {
  interface NextRequest {
    user?: any // Replace 'any' with your User type
  }
} 

// Maintain backward compatibility with existing API routes
export async function getAuthenticatedUserId() {
  const { userId } = auth()
  if (!userId) {
    return { userId: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }
  }

  try {
    const dbUser = await findUserByClerkId(userId)
    
    if (!dbUser || shouldSync(dbUser.updatedAt)) {
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return { userId: null, error: { message: 'User not found', code: 'NOT_FOUND' } }
      }

      const { user, error } = await syncUser({ clerkUser })
      if (error || !user) {
        return { userId: null, error: error || { message: 'User not found', code: 'NOT_FOUND' } }
      }

      return { userId: user.id, error: null }
    }

    return { userId: dbUser.id, error: null }
  } catch (error) {
    console.error('Error in getAuthenticatedUserId:', error)
    return { 
      userId: null, 
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } 
    }
  }
} 