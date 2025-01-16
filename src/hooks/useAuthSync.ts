'use client'

import { useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'

export function useAuthSync() {
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      console.log('Attempting to sync user...')
      fetch('/api/auth/sync', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => {
          console.log('Sync response:', response.status)
        })
        .catch(error => {
          console.error('Sync error:', error)
        })
    }
  }, [user?.id])
} 