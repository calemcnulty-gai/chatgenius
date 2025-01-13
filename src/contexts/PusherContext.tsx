'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
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
  const channelRef = useRef<any | null>(null)

  useEffect(() => {
    if (!userId || !pusherClient) return

    // If we already have a channel for this user, don't resubscribe
    if (channelRef.current?.name === `user-${userId}`) {
      console.log('[PusherContext] Channel already exists:', channelRef.current.name)
      return
    }

    console.log('[PusherContext] Setting up user channel subscription:', {
      userId,
      channelName: `user-${userId}`,
      connectionState: pusherClient.connection.state
    })
    
    const channel = pusherClient.subscribe(`user-${userId}`)
    channelRef.current = channel
    
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[PusherContext] Successfully subscribed to channel:', `user-${userId}`)
      setUserChannel(channel)
    })
    
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('[PusherContext] Subscription error:', error)
    })

    return () => {
      // Only clean up if we're switching to a different user
      if (channelRef.current?.name !== `user-${userId}`) {
        console.log('[PusherContext] Cleaning up user channel subscription')
        if (pusherClient) {
          channel.unbind_all()
          pusherClient.unsubscribe(`user-${userId}`)
          channelRef.current = null
        }
      }
    }
  }, [userId])

  return (
    <PusherContext.Provider value={{ userChannel: userChannel || channelRef.current }}>
      {children}
    </PusherContext.Provider>
  )
}

export function usePusherChannel() {
  return useContext(PusherContext)
} 