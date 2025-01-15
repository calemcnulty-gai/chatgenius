import { findUserByClerkId, updateUserProfile } from '../queries'
import { validateProfileUpdate } from '../validation'
import type { UpdateProfileParams, DBUser, AuthError } from '../types'

export async function updateProfile(
  params: UpdateProfileParams
): Promise<{ user: DBUser | null; error?: AuthError }> {
  // Validate input
  const validationError = validateProfileUpdate(params)
  if (validationError) {
    return { user: null, error: validationError }
  }

  // Check if user exists
  const existingUser = await findUserByClerkId(params.clerkId)
  if (!existingUser) {
    return {
      user: null,
      error: {
        message: 'User not found',
        code: 'NOT_FOUND'
      }
    }
  }

  try {
    // Update user profile
    const user = await updateUserProfile(params)
    return { user }
  } catch (error) {
    console.error('Error updating profile:', error)
    return {
      user: null,
      error: {
        message: 'Failed to update profile',
        code: 'INVALID_INPUT'
      }
    }
  }
} 