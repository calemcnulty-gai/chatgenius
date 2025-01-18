'use client'

import { createContext, useContext, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/types/user'
import { useAuthState, type UserAuthState } from '@/hooks/useAuthState'
import { useUserRefresh } from '@/hooks/useUserRefresh'
import { usePeriodicRefresh } from '@/hooks/usePeriodicRefresh'

interface UserAuthContextType extends UserAuthState {
  refreshUser: () => Promise<void>
  clearError: () => void
}

const UserAuthContext = createContext<UserAuthContextType | null>(null)

export function useUserAuth() {
  const context = useContext(UserAuthContext)
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider')
  }
  return context
}

interface UserAuthProviderProps {
  children: ReactNode
}

export function UserAuthProvider({ children }: UserAuthProviderProps) {
  const [state, setState] = useAuthState()

  const setUser = useCallback((user: User | null) => {
    setState(prev => ({ ...prev, user }))
  }, [setState])

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [setState])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [setState])

  const refreshUserCallback = useUserRefresh(setLoading, setError, setUser)
  
  const refreshUser = useCallback(async () => {
    await refreshUserCallback()
  }, [refreshUserCallback])

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  // Initial load
  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Periodic refresh
  usePeriodicRefresh(state.user, refreshUser)

  return (
    <UserAuthContext.Provider value={{ ...state, refreshUser, clearError }}>
      {children}
    </UserAuthContext.Provider>
  )
} 