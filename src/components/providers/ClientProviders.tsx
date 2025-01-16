'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { PusherProvider } from '@/contexts/PusherContext'
import { UserProvider } from '@/contexts/UserContext'
import { useUser } from '@/contexts/UserContext'

function PusherWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  
  if (!user) {
    return <>{children}</>
  }

  return (
    <PusherProvider userId={user.id}>
      {children}
    </PusherProvider>
  )
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <PusherWrapper>
        {children}
      </PusherWrapper>
    </UserProvider>
  )
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AuthWrapper>{children}</AuthWrapper>
    </ClerkProvider>
  )
} 