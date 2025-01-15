import { User } from '@clerk/nextjs/server'
import { getUserProfile, updateUserProfile } from '../queries'
import { validateProfileUpdate, validateProfileImage } from '../validation'
import type { UpdateProfileParams, UserResponse, UpdateProfileResponse } from '../types'

export async function getProfile(clerkUser: User): Promise<UserResponse> {
  try {
    const profile = await getUserProfile(clerkUser.id)
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
  clerkUser: User,
  params: Omit<UpdateProfileParams, 'clerkId'>
): Promise<UpdateProfileResponse> {
  try {
    const validationError = validateProfileUpdate({
      clerkId: clerkUser.id,
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
      clerkId: clerkUser.id,
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