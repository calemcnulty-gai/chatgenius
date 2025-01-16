import type { UpdateProfileParams, UserResponse, UpdateProfileResponse } from '../types'
import type { DBUser } from '@/lib/auth/types'
import { getUserProfile, updateUserProfile } from '../queries'
import { validateProfileUpdate, validateProfileImage } from '../validation'

export async function getProfile(userId: string): Promise<UserResponse> {
  try {
    const profile = await getUserProfile(userId)
    if (!profile) {
      return {
        user: null,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND'
        }
      }
    }

    return { user: profile }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return {
      user: null,
      error: {
        message: 'Failed to get user profile',
        code: 'NOT_FOUND'
      }
    }
  }
}

export async function updateProfile(
  userId: string,
  params: Omit<UpdateProfileParams, 'userId'>
): Promise<UpdateProfileResponse> {
  try {
    const validationError = validateProfileUpdate({
      userId,
      ...params
    })
    if (validationError) {
      return {
        user: null,
        error: validationError
      }
    }

    if (params.profileImage) {
      const imageError = validateProfileImage(params.profileImage)
      if (imageError) {
        return {
          user: null,
          error: imageError
        }
      }
    }

    const user = await updateUserProfile({
      userId,
      ...params
    })

    return { user }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return {
      user: null,
      error: {
        message: 'Failed to update user profile',
        code: 'INVALID_INPUT'
      }
    }
  }
} 