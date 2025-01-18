import { useCallback } from 'react'
import type { User } from '@/types/user'

interface RefreshResult {
  user?: User | null
  error?: string
}

export function useUserRefresh(
  setLoading: (isLoading: boolean) => void,
  setError: (error: string | null) => void,
  setUser: (user: User | null) => void
) {
  return useCallback(async (): Promise<RefreshResult> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/users/me')
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 401) {
          setUser(null)
          setLoading(false)
          return { user: null }
        }
        
        throw new Error(data.error?.message || 'Failed to refresh user data')
      }

      setUser(data.user)
      setLoading(false)
      return { user: data.user }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh user data'
      setUser(null)
      setError(errorMessage)
      setLoading(false)
      return { error: errorMessage }
    }
  }, [setLoading, setError, setUser])
} 