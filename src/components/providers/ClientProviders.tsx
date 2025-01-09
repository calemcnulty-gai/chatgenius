'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { useAuthSync } from '@/hooks/useAuthSync'
import { PusherProvider } from '@/contexts/PusherContext'
import { UserProvider } from '@/contexts/UserContext'
import { useState, useEffect } from 'react'
import { User } from '@/types/user'

function AuthSyncWrapper({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial user data
    setIsLoading(true)
    fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        setUserId(data.id)
        setUser(data)
      })
      .catch(error => {
        console.error('Error syncing user:', error)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Show loading state while we fetch user data
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-lg text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <UserProvider initialUser={user}>
      <PusherProvider userId={userId!}>
        {children}
      </PusherProvider>
    </UserProvider>
  )
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AuthSyncWrapper>{children}</AuthSyncWrapper>
    </ClerkProvider>
  )
} 