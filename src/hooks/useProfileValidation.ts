import { useCallback } from 'react'
import type { User } from '@/types/user'

export function useProfileValidation() {
  return useCallback((profile: Partial<User>): boolean => {
    if (profile.status && !['active', 'away', 'offline'].includes(profile.status)) {
      return false
    }
    // Add more validation as needed
    return true
  }, [])
} 