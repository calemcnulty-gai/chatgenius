import { useCallback } from 'react'
import type { User, UserStatus } from '@/types/user'

interface StatusUpdateResult {
  status?: UserStatus
  error: string | null
}

export function useStatusUpdate(updateProfile: (update: Partial<User>) => Promise<void>) {
  return useCallback(async (status: UserStatus): Promise<StatusUpdateResult> => {
    try {
      await updateProfile({ status })
      return { status, error: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to update status'
      }
    }
  }, [updateProfile])
} 