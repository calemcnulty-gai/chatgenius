import { auth } from '@clerk/nextjs'
import { getInternalUserId } from './services/user'
import type { AuthError } from './types'

/**
 * Gets the authenticated internal user ID.
 * This is the only place where we interact with Clerk directly.
 * All other parts of the application should use the internal user ID.
 */
export async function getAuthenticatedUserId(): Promise<{ 
  userId: string | null; 
  error?: AuthError 
}> {
  try {
    const { userId: clerkId } = auth()
    if (!clerkId) {
      return {
        userId: null,
        error: {
          message: 'Not authenticated',
          code: 'UNAUTHORIZED'
        }
      }
    }

    return getInternalUserId(clerkId)
  } catch (error) {
    console.error('Auth error:', error)
    return {
      userId: null,
      error: {
        message: 'Authentication failed',
        code: 'UNAUTHORIZED'
      }
    }
  }
} 