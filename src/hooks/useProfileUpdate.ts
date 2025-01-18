import { useCallback } from 'react'
import type { User } from '@/types/user'

interface ProfileUpdateResult {
  success: boolean
  error?: string
}

export function useProfileUpdate(
  validateProfile: (profile: Partial<User>) => boolean,
  refreshUser: () => Promise<void>,
  setUpdating: (isUpdating: boolean) => void,
  setError: (error: string | null) => void
) {
  return useCallback(async (update: Partial<User>): Promise<ProfileUpdateResult> => {
    // Validate the update
    if (!validateProfile(update)) {
      setError('Invalid profile data provided')
      return { success: false, error: 'Invalid profile data provided' }
    }

    setUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      await refreshUser() // Refresh user data after successful update
      setUpdating(false)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setError(errorMessage)
      setUpdating(false)
      return { success: false, error: errorMessage }
    }
  }, [validateProfile, refreshUser, setUpdating, setError])
} 