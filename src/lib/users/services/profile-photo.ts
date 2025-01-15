import { User } from '@clerk/nextjs/server'
import { put } from '@vercel/blob'
import { updateProfile } from './profile'
import type { UpdateProfileResponse } from '../types'

export async function uploadProfilePhoto(
  clerkUser: User,
  file: File
): Promise<UpdateProfileResponse> {
  try {
    // Upload to Vercel Blob
    const { url } = await put(file.name, file, {
      access: 'public',
    })

    // Update user's profile image
    return await updateProfile(clerkUser, {
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
  clerkUser: User
): Promise<UpdateProfileResponse> {
  try {
    return await updateProfile(clerkUser, {
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