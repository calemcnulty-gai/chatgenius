import { User } from '@clerk/nextjs/server'
import { findUserByClerkId } from '@/lib/users/queries'
import type { AuthError } from '../types'

export async function getInternalUserId(
  clerkUser: User
): Promise<{ userId: string | null; error?: AuthError }> {
  try {
    const user = await findUserByClerkId(clerkUser.id)
    if (!user) {
      return {
        userId: null,
        error: {
          message: 'User not found in internal database',
          code: 'NOT_FOUND'
        }
      }
    }

    return { userId: user.id }
  } catch (error) {
    console.error('Error getting internal user ID:', error)
    return {
      userId: null,
      error: {
        message: 'Failed to get internal user ID',
        code: 'INVALID_INPUT'
      }
    }
  }
} 