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
  console.log('[UserChannel] Hook called', { userId: user?.id, isConnected })
  
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
      console.log('[UserChannel] Unsubscribing', { userId: user?.id })
      state.channel.unbind_all()
      state.channel.unsubscribe()
      setState(prev => ({ 
        ...prev,
        channel: null,
        subscriptionState: 'INITIAL'
      }))
    }
  }, [state.channel, user?.id])

  const subscribe = useCallback(async () => {
    if (!user?.id || !client || !isConnected || state.subscriptionState === 'SUBSCRIBING') {
      console.log('[UserChannel] Skipping subscription', { 
        userId: user?.id, 
        hasClient: !!client, 
        isConnected, 
        subscriptionState: state.subscriptionState 
      })
      return
    }

    console.log('[UserChannel] Starting subscription', { userId: user.id })
    setState(prev => ({ ...prev, subscriptionState: 'SUBSCRIBING', error: null }))

    try {
      const channelName = `private-user-${user.id}`
      console.log('[UserChannel] Subscribing to channel', { channelName })
      const channel = client.subscribe(channelName)

      // Create a promise that resolves when subscription succeeds or fails
      await new Promise((resolve, reject) => {
        const handleSuccess = () => {
          console.log('[UserChannel] Subscription succeeded', { channelName })
          setState(prev => ({ 
            ...prev,
            channel,
            subscriptionState: 'SUBSCRIBED'
          }))
          channel.unbind('pusher:subscription_succeeded', handleSuccess)
          channel.unbind('pusher:subscription_error', handleError)
          resolve(true)
        }

        const handleError = (error: Error) => {
          console.error('[UserChannel] Subscription error', { channelName, error })
          setState(prev => ({
            ...prev,
            error: error.message,
            subscriptionState: 'ERROR'
          }))
          channel.unbind('pusher:subscription_succeeded', handleSuccess)
          channel.unbind('pusher:subscription_error', handleError)
          reject(error)
        }

        channel.bind('pusher:subscription_succeeded', handleSuccess)
        channel.bind('pusher:subscription_error', handleError)
      })
    } catch (error) {
      console.error('[UserChannel] Subscribe error', { userId: user.id, error })
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
      console.log('[UserChannel] Connection ready, attempting subscribe', { userId: user.id })
      subscribe()
    } else {
      console.log('[UserChannel] Connection not ready or no user', { isConnected, userId: user?.id })
      unsubscribe()
    }
  }, [isConnected, user, subscribe, unsubscribe])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[UserChannel] Cleaning up subscription', { userId: user?.id })
      unsubscribe()
    }
  }, [unsubscribe, user?.id])

  return {
    ...state,
    subscribe,
    unsubscribe,
    clearError
  }
} 