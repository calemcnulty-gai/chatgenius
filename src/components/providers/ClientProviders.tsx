'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { useAuthSync } from '@/hooks/useAuthSync'
import { PusherProvider } from '@/contexts/PusherContext'
import { useState, useEffect } from 'react'

function AuthSyncWrapper({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get initial user data
    fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        setUserId(data.id)
      })
      .catch(error => {
        console.error('Error syncing user:', error)
      })
  }, [])

  // Only render PusherProvider when we have the user ID
  return userId ? (
    <PusherProvider userId={userId}>
      {children}
    </PusherProvider>
  ) : children
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AuthSyncWrapper>{children}</AuthSyncWrapper>
    </ClerkProvider>
  )
} 