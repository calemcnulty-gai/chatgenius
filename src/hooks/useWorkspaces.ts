'use client'

import { useEffect, useState } from 'react'
import { useUserAuth } from '@/contexts/user/UserAuthContext'

type Workspace = {
  id: string
  name: string
  description: string | null
  slug: string
  role: string
}

export function useWorkspaces() {
  const { user, isLoading: isLoadingUser } = useUserAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Don't fetch until we know about the user state
    if (isLoadingUser) {
      return
    }

    // If no user, clear workspaces
    if (!user) {
      setWorkspaces([])
      setIsLoading(false)
      return
    }

    // Fetch workspaces using our internal user ID
    fetch('/api/workspaces')
      .then(res => res.json())
      .then(data => {
        if (data.workspaces) {
          setWorkspaces(data.workspaces)
        } else {
          setWorkspaces([])
        }
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Error fetching workspaces:', err)
        setError('Failed to load workspaces')
        setIsLoading(false)
      })
  }, [user?.id, isLoadingUser])

  return { workspaces, isLoading: isLoading || isLoadingUser, error }
} 