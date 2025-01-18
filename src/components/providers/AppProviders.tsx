'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { PusherConnectionProvider } from '@/contexts/pusher/PusherConnectionContext'
import { UserChannelProvider } from '@/contexts/pusher/UserChannelContext'
import { UserAuthProvider } from '@/contexts/user/UserAuthContext'
import { UserProfileProvider } from '@/contexts/user/UserProfileContext'
import { UserStatusProvider } from '@/contexts/user/UserStatusContext'
import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { PusherHeartbeatProvider } from './PusherHeartbeatProvider'

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || ''
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || ''

function PusherWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUserAuth()
  
  // Don't render PusherProvider until user is loaded
  if (isLoading) {
    return <>{children}</>
  }

  return (
    <PusherConnectionProvider cluster={PUSHER_CLUSTER} key={PUSHER_KEY}>
      <UserChannelProvider>
        <PusherHeartbeatProvider>
          {children}
        </PusherHeartbeatProvider>
      </UserChannelProvider>
    </PusherConnectionProvider>
  )
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <UserAuthProvider>
        <UserProfileProvider>
          <UserStatusProvider>
            <PusherWrapper>
              {children}
            </PusherWrapper>
          </UserStatusProvider>
        </UserProfileProvider>
      </UserAuthProvider>
    </ClerkProvider>
  )
} 