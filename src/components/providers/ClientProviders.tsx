'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { useAuthSync } from '@/hooks/useAuthSync'
import { PusherProvider } from '@/contexts/PusherContext'
import { UserProvider } from '@/contexts/UserContext'
import { useState, useEffect } from 'react'
import { User } from '@/types/user'

function AuthSyncWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isLoaded: isClerkLoaded, isSignedIn } = useAuth()

  // Get initial user data
  useEffect(() => {
    const syncUser = async () => {
      try {
        // Only sync if Clerk is loaded and user is signed in
        if (!isClerkLoaded || !isSignedIn) {
          setIsLoading(false)
          return
        }

        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error('Error syncing user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    syncUser()
  }, [isClerkLoaded, isSignedIn])

  // Show loading state while we fetch user data
  if (!isClerkLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-lg text-gray-400">Loading...</div>
      </div>
    )
  }

  // If not signed in, just render children (which should include sign-in UI)
  if (!isSignedIn) {
    return <>{children}</>
  }

  // If signed in but no user data yet, show loading
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-lg text-gray-400">Loading user data...</div>
      </div>
    )
  }

  return (
    <UserProvider initialUser={user}>
      <PusherProvider userId={user.id}>
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