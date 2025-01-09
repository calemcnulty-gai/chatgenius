'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@clerk/nextjs'
import { pusherClient } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'

type PusherContextType = {
  userChannel: any | null // Using any for Pusher.Channel type
}

const PusherContext = createContext<PusherContextType>({ userChannel: null })

export function PusherProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth()
  const [userChannel, setUserChannel] = useState<any | null>(null)

  useEffect(() => {
    if (!userId || !pusherClient) return

    console.log('[PusherContext] Setting up user channel subscription')
    const channel = pusherClient.subscribe(`user-${userId}`)
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