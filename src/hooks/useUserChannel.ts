import { useState, useCallback, useEffect } from 'react'
import type { Channel } from 'pusher-js'
import type { DBUser } from '@/lib/auth/types'
import type Pusher from 'pusher-js'

type SubscriptionState = 'INITIAL' | 'SUBSCRIBING' | 'SUBSCRIBED' | 'ERROR'

interface UserChannelState {
  channel: Channel | null
  subscriptionState: SubscriptionState
  error: string | null
}

export function useUserChannelSubscription(
  user: DBUser | null,
  client: Pusher | null,
  isConnected: boolean
) {
  const [state, setState] = useState<UserChannelState>({
    channel: null,
    subscriptionState: 'INITIAL',
    error: null
  })

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const unsubscribe = useCallback(() => {
    if (state.channel) {
      state.channel.unbind_all()
      state.channel.unsubscribe()
      setState(prev => ({ 
        ...prev,
        channel: null,
        subscriptionState: 'INITIAL'
      }))
    }
  }, [state.channel])

  const subscribe = useCallback(async () => {
    if (!user?.id || !client || !isConnected || state.subscriptionState === 'SUBSCRIBING') return

    setState(prev => ({ ...prev, subscriptionState: 'SUBSCRIBING', error: null }))

    try {
      const channelName = `private-user-${user.id}`
      const channel = client.subscribe(channelName)

      channel.bind('pusher:subscription_succeeded', () => {
        setState(prev => ({ 
          ...prev,
          subscriptionState: 'SUBSCRIBED'
        }))
      })

      channel.bind('pusher:subscription_error', (error: Error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          subscriptionState: 'ERROR'
        }))
      })

      setState(prev => ({ ...prev, channel }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to subscribe to user channel',
        subscriptionState: 'ERROR'
      }))
    }
  }, [user?.id, client, isConnected, state.subscriptionState])

  // Auto-subscribe when connection is ready
  useEffect(() => {
    if (isConnected && user) {
      subscribe()
    } else {
      unsubscribe()
    }
  }, [isConnected, user, subscribe, unsubscribe])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return {
    ...state,
    subscribe,
    unsubscribe,
    clearError
  }
} 