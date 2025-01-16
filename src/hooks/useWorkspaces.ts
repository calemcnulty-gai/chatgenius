'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'

type Workspace = {
  id: string
  name: string
  description: string | null
  slug: string
  role: string
}

export function useWorkspaces() {
  const { user } = useUser()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
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
    }
  }, [user?.id])

  return { workspaces, isLoading, error }
} 