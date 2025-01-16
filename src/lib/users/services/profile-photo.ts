import { put } from '@vercel/blob'
import type { UpdateProfileResponse } from '../types'
import type { DBUser } from '@/lib/auth/types'
import { updateProfile } from './profile'

export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<UpdateProfileResponse> {
  try {
    // Upload to Vercel Blob
    const { url } = await put(file.name, file, {
      access: 'public',
    })

    // Update user's profile image
    return await updateProfile(userId, {
      profileImage: url
    })
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    return {
      user: null,
      error: {
        message: 'Failed to upload profile photo',
        code: 'INVALID_INPUT'
      }
    }
  }
}

export async function removeProfilePhoto(
  userId: string
): Promise<UpdateProfileResponse> {
  try {
    return await updateProfile(userId, {
      profileImage: null
    })
  } catch (error) {
    console.error('Error removing profile photo:', error)
    return {
      user: null,
      error: {
        message: 'Failed to remove profile photo',
        code: 'INVALID_INPUT'
      }
    }
  }
} 