import { useState, useCallback, useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import type { DBUser } from '@/lib/auth/types'

interface PusherConnectionState {
  client: Pusher | null
  isConnecting: boolean
  isConnected: boolean
  error: string | null
}

export function useInitializePusherConnection(
  user: DBUser | null,
  key: string,
  cluster: string
) {
  console.log('[PusherConnection] Hook called', { userId: user?.id })

  const [state, setState] = useState<PusherConnectionState>({
    client: null,
    isConnecting: false,
    isConnected: false,
    error: null
  })

  const heartbeatInterval = useRef<NodeJS.Timeout>()

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const disconnect = useCallback(() => {
    if (state.client) {
      console.log('[PusherConnection] Disconnecting')
      state.client.disconnect()
      setState(prev => ({
        ...prev,
        client: null,
        isConnecting: false,
        isConnected: false
      }))
    }

    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current)
    }
  }, [state.client])

  const connect = useCallback(async () => {
    if (!user?.id || state.isConnecting) {
      console.log('[PusherConnection] Skipping connection', { 
        userId: user?.id, 
        isConnecting: state.isConnecting 
      })
      return
    }

    console.log('[PusherConnection] Starting connection')
    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const client = new Pusher(key, {
        cluster,
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      })

      client.connection.bind('connected', () => {
        console.log('[PusherConnection] Connected')
        setState(prev => ({ ...prev, isConnected: true }))

        // Start heartbeat to keep connection alive
        heartbeatInterval.current = setInterval(() => {
          client.connection.send_event('client_heartbeat', {})
        }, 30000)
      })

      client.connection.bind('disconnected', () => {
        console.log('[PusherConnection] Disconnected')
        setState(prev => ({ ...prev, isConnected: false }))
      })

      client.connection.bind('error', (error: Error) => {
        console.error('[PusherConnection] Connection error', error)
        setState(prev => ({
          ...prev,
          error: error.message,
          isConnecting: false,
          isConnected: false
        }))
      })

      setState(prev => ({ ...prev, client }))
    } catch (error) {
      console.error('[PusherConnection] Connect error', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to connect to Pusher',
        isConnecting: false
      }))
    }
  }, [user?.id, key, cluster, state.isConnecting])

  // Auto-connect when user is available
  useEffect(() => {
    if (user) {
      console.log('[PusherConnection] User available, attempting connect')
      connect()
    } else {
      console.log('[PusherConnection] No user, disconnecting')
      disconnect()
    }
  }, [user, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[PusherConnection] Cleaning up connection')
      disconnect()
    }
  }, [disconnect])

  return {
    ...state,
    connect,
    disconnect,
    clearError
  }
} 