'use client'

import { createContext, useContext, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/types/user'
import { useUserAuth } from './UserAuthContext'
import { useProfileState, type UserProfileState } from '@/hooks/useProfileState'
import { useProfileValidation } from '@/hooks/useProfileValidation'
import { useProfileUpdate } from '@/hooks/useProfileUpdate'

interface UserProfileContextType extends UserProfileState {
  updateProfile: (update: Partial<User>) => Promise<void>
  clearError: () => void
}

const UserProfileContext = createContext<UserProfileContextType | null>(null)

export function useUserProfile() {
  const context = useContext(UserProfileContext)
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return context
}

interface UserProfileProviderProps {
  children: ReactNode
}

export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const { refreshUser } = useUserAuth()
  const [state, setState] = useProfileState()
  const validateProfile = useProfileValidation()

  const setUpdating = useCallback((isUpdating: boolean) => {
    setState(prev => ({ ...prev, isUpdating }))
  }, [setState])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [setState])

  const updateProfileCallback = useProfileUpdate(
    validateProfile,
    refreshUser,
    setUpdating,
    setError
  )

  const updateProfile = useCallback(async (update: Partial<User>) => {
    await updateProfileCallback(update)
  }, [updateProfileCallback])

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  return (
    <UserProfileContext.Provider value={{ ...state, updateProfile, clearError }}>
      {children}
    </UserProfileContext.Provider>
  )
} 