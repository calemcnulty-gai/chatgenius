'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { pusherClient } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'

type PusherContextType = {
  userChannel: any | null // Using any for Pusher.Channel type
}

const PusherContext = createContext<PusherContextType>({ userChannel: null })

interface PusherProviderProps {
  children: ReactNode
  userId: string
}

export function PusherProvider({ children, userId }: PusherProviderProps) {
  const [userChannel, setUserChannel] = useState<any | null>(null)

  useEffect(() => {
    if (!userId || !pusherClient) return

    console.log('[PusherContext] Setting up user channel subscription:', {
      userId,
      channelName: `user-${userId}`,
      connectionState: pusherClient.connection.state
    })
    
    const channel = pusherClient.subscribe(`user-${userId}`)
    
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[PusherContext] Successfully subscribed to channel:', `user-${userId}`)
    })
    
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[PusherContext] Subscription error:', error)
    })
    
    setUserChannel(channel)

    return () => {
      console.log('[PusherContext] Cleaning up user channel subscription')
      if (pusherClient) {
        channel.unbind_all()
        pusherClient.unsubscribe(`user-${userId}`)
      }
    }
  }, [userId])

  return (
    <PusherContext.Provider value={{ userChannel }}>
      {children}
    </PusherContext.Provider>
  )
}

export function usePusherChannel() {
  return useContext(PusherContext)
} 