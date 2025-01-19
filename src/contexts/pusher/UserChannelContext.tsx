'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Channel } from 'pusher-js'
import { useUserAuth } from '../user/UserAuthContext'
import { usePusherConnection } from './PusherConnectionContext'
import { useUserChannelSubscription } from '@/hooks/useUserChannel'

type SubscriptionState = 'INITIAL' | 'SUBSCRIBING' | 'SUBSCRIBED' | 'ERROR'

interface UserChannelState {
  channel: Channel | null
  subscriptionState: SubscriptionState
  error: string | null
}

interface UserChannelContextType extends UserChannelState {
  subscribe: () => Promise<void>
  unsubscribe: () => void
  clearError: () => void
}

const UserChannelContext = createContext<UserChannelContextType | null>(null)

export function useUserChannel() {
  const context = useContext(UserChannelContext)
  if (!context) {
    throw new Error('useUserChannel must be used within a UserChannelProvider')
  }
  return context
}

interface UserChannelProviderProps {
  children: ReactNode
}

export function UserChannelProvider({ children }: UserChannelProviderProps) {
  const { user } = useUserAuth()
  const { client, isConnected } = usePusherConnection()
  const channelState = useUserChannelSubscription(user, client, isConnected)

  console.log('[UserChannelContext] Current state', { 
    userId: user?.id,
    isConnected,
    subscriptionState: channelState.subscriptionState,
    hasChannel: !!channelState.channel
  })

  return (
    <UserChannelContext.Provider value={channelState}>
      {children}
    </UserChannelContext.Provider>
  )
} 