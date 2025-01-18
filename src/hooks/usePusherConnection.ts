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
      state.client.disconnect()
      setState(prev => ({ 
        ...prev,
        client: null,
        isConnected: false,
        isConnecting: false
      }))
    }

    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current)
    }
  }, [state.client])

  const connect = useCallback(async () => {
    if (!user || state.isConnecting || state.isConnected) return

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const client = new Pusher(key, {
        cluster,
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      })

      client.connection.bind('connected', () => {
        setState(prev => ({ 
          ...prev,
          isConnected: true,
          isConnecting: false
        }))

        // Start heartbeat to keep connection alive
        heartbeatInterval.current = setInterval(() => {
          client.connection.send_event('client_heartbeat', {})
        }, 30000)
      })

      client.connection.bind('disconnected', () => {
        setState(prev => ({ 
          ...prev,
          isConnected: false
        }))
      })

      client.connection.bind('error', (error: Error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          isConnecting: false
        }))
      })

      setState(prev => ({ ...prev, client }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize Pusher client',
        isConnecting: false
      }))
    }
  }, [user, state.isConnecting, state.isConnected, key, cluster])

  // Auto-connect when user is available
  useEffect(() => {
    if (user) {
      connect()
    } else {
      disconnect()
    }
  }, [user, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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