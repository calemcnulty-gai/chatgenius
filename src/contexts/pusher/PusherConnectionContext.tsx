'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type Pusher from 'pusher-js'
import { useUserAuth } from '../user/UserAuthContext'
import { useInitializePusherConnection } from '@/hooks/usePusherConnection'

interface PusherConnectionState {
  client: Pusher | null
  isConnecting: boolean
  isConnected: boolean
  error: string | null
}

interface PusherConnectionContextType extends PusherConnectionState {
  connect: () => Promise<void>
  disconnect: () => void
  clearError: () => void
}

const PusherConnectionContext = createContext<PusherConnectionContextType | null>(null)

export function usePusherConnection() {
  const context = useContext(PusherConnectionContext)
  if (!context) {
    throw new Error('usePusherConnection must be used within a PusherConnectionProvider')
  }
  return context
}

interface PusherConnectionProviderProps {
  children: ReactNode
  cluster: string
  apiKey: string
}

export function PusherConnectionProvider({ 
  children,
  cluster,
  apiKey
}: PusherConnectionProviderProps) {
  const { user } = useUserAuth()
  const connectionState = useInitializePusherConnection(user, apiKey, cluster)

  return (
    <PusherConnectionContext.Provider value={connectionState}>
      {children}
    </PusherConnectionContext.Provider>
  )
} 