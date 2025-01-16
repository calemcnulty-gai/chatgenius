import { db } from '@/db'
import { userAuth } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { AuthError } from '../types'

export async function getInternalUserId(
  clerkId: string
): Promise<{ userId: string | null; error?: AuthError }> {
  try {
    const authRecord = await db.query.userAuth.findFirst({
      where: eq(userAuth.clerkId, clerkId),
    })

    if (!authRecord) {
      return {
        userId: null,
        error: {
          message: 'User not found in internal database',
          code: 'NOT_FOUND'
        }
      }
    }

    return { userId: authRecord.userId }
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