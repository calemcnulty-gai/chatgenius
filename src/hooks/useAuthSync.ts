'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function useAuthSync() {
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
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
  }, [isLoaded, isSignedIn])
} 