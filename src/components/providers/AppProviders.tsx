'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { PusherConnectionProvider } from '@/contexts/pusher/PusherConnectionContext'
import { UserChannelProvider } from '@/contexts/pusher/UserChannelContext'
import { UserAuthProvider } from '@/contexts/user/UserAuthContext'
import { UserProfileProvider } from '@/contexts/user/UserProfileContext'
import { UserStatusProvider } from '@/contexts/user/UserStatusContext'
import { PusherHeartbeatProvider } from './PusherHeartbeatProvider'
import { SWRConfig } from 'swr'

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || ''
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || ''

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <SWRConfig value={{ provider: () => new Map() }}>
        <UserAuthProvider>
          <UserProfileProvider>
            <UserStatusProvider>
              <PusherConnectionProvider cluster={PUSHER_CLUSTER} apiKey={PUSHER_KEY}>
                <UserChannelProvider>
                  <PusherHeartbeatProvider>
                    {children}
                  </PusherHeartbeatProvider>
                </UserChannelProvider>
              </PusherConnectionProvider>
            </UserStatusProvider>
          </UserProfileProvider>
        </UserAuthProvider>
      </SWRConfig>
    </ClerkProvider>
  )
} 