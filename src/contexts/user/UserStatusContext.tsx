'use client'

import { createContext, useContext, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { UserStatus } from '@/types/user'
import { useUserAuth } from './UserAuthContext'
import { useUserProfile } from './UserProfileContext'
import { useAutoAway } from '@/hooks/useAutoAway'
import { useStatusState } from '@/hooks/useStatusState'
import { useStatusUpdate } from '@/hooks/useStatusUpdate'

interface UserStatusState {
  status: UserStatus
  isUpdating: boolean
  error: string | null
}

interface UserStatusContextType extends UserStatusState {
  setStatus: (status: UserStatus) => Promise<void>
  clearError: () => void
}

const UserStatusContext = createContext<UserStatusContextType | null>(null)

export function useUserStatus() {
  const context = useContext(UserStatusContext)
  if (!context) {
    throw new Error('useUserStatus must be used within a UserStatusProvider')
  }
  return context
}

interface UserStatusProviderProps {
  children: ReactNode
}

export function UserStatusProvider({ children }: UserStatusProviderProps) {
  const { user } = useUserAuth()
  const { updateProfile } = useUserProfile()
  
  const [state, setState] = useStatusState(user?.status || 'offline')
  const updateStatus = useStatusUpdate(updateProfile)
  
  const setStatus = useCallback(async (status: UserStatus) => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }))
    const result = await updateStatus(status)
    setState(prev => ({
      ...prev,
      ...(result.status ? { status: result.status } : {}),
      error: result.error,
      isUpdating: false
    }))
  }, [updateStatus])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  useAutoAway(!!user, state.status, setStatus)

  // Update local status when user changes
  useEffect(() => {
    if (user?.status) {
      setState(prev => ({ ...prev, status: user.status }))
    }
  }, [user?.status])

  return (
    <UserStatusContext.Provider value={{ ...state, setStatus, clearError }}>
      {children}
    </UserStatusContext.Provider>
  )
} 