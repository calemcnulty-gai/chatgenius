'use client'

import { createContext, useContext, useCallback, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { User } from '@/types/user'

interface UserContextState {
  user: User | null
  isLoading: boolean
  error: string | null
}

interface UserContextType extends UserContextState {
  updateUser: (update: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

const UserContext = createContext<UserContextType | null>(null)

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  initialUser: User
  children: ReactNode
}

export function UserProvider({ initialUser, children }: UserProviderProps) {
  const [state, setState] = useState<UserContextState>({
    user: initialUser,
    isLoading: false,
    error: null,
  })

  // Validate user data against the User type
  const validateUser = (user: Partial<User>): boolean => {
    if (user.status && !['active', 'away', 'offline'].includes(user.status)) {
      return false
    }
    // Add more validation as needed
    return true
  }

  const updateUser = useCallback(async (update: Partial<User>) => {
    // Validate the update
    if (!validateUser(update)) {
      setState(prev => ({
        ...prev,
        error: 'Invalid user data provided'
      }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Only include changed fields in the API call
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      const updatedUser = await response.json()
      setState(prev => ({
        ...prev,
        user: { ...prev.user!, ...updatedUser },
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false
      }))
    }
  }, [])

  const refreshUser = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to refresh user data')
      }

      const refreshedUser = await response.json()
      setState(prev => ({
        ...prev,
        user: refreshedUser,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh user data',
        isLoading: false
      }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Set up periodic refresh
  useEffect(() => {
    const interval = setInterval(refreshUser, 5 * 60 * 1000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [refreshUser])

  return (
    <UserContext.Provider 
      value={{ 
        ...state, 
        updateUser, 
        refreshUser,
        clearError
      }}
    >
      {children}
    </UserContext.Provider>
  )
} 