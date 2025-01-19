'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Channel } from 'pusher-js'
import type Pusher from 'pusher-js'

type SubscriptionState = 'INITIAL' | 'SUBSCRIBING' | 'SUBSCRIBED' | 'ERROR'

interface ChatChannelState {
  channel: Channel | null
  subscriptionState: SubscriptionState
  error: string | null
}

export function useChatChannel(
  channelId: string,
  variant: 'channel' | 'dm',
  client: Pusher | null,
  isConnected: boolean
) {
  console.log('[ChatChannel] Hook called', { channelId, variant, isConnected })
  
  const [state, setState] = useState<ChatChannelState>({
    channel: null,
    subscriptionState: 'INITIAL',
    error: null
  })
  const currentChannel = useRef<Channel | null>(null)

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const unsubscribe = useCallback(() => {
    if (currentChannel.current) {
      console.log('[ChatChannel] Unsubscribing', { channelId })
      currentChannel.current.unbind_all()
      currentChannel.current.unsubscribe()
      currentChannel.current = null
      setState(prev => ({ 
        ...prev,
        channel: null,
        subscriptionState: 'INITIAL'
      }))
    }
  }, [channelId])

  const subscribe = useCallback(async () => {
    if (!channelId || !client || !isConnected || state.subscriptionState === 'SUBSCRIBING') {
      console.log('[ChatChannel] Skipping subscription', { 
        channelId, 
        hasClient: !!client, 
        isConnected, 
        subscriptionState: state.subscriptionState 
      })
      return
    }

    setState(prev => ({ ...prev, subscriptionState: 'SUBSCRIBING', error: null }))

    try {
      const channelName = variant === 'channel' 
        ? `private-channel-${channelId}`
        : `private-dm-${channelId}`
      
      console.log('[ChatChannel] Subscribing to channel', { channelName })
      const channel = client.subscribe(channelName)
      currentChannel.current = channel

      // Create a promise that resolves when subscription succeeds or fails
      await new Promise((resolve, reject) => {
        const handleSuccess = () => {
          console.log('[ChatChannel] Subscription succeeded', { channelName })
          if (currentChannel.current === channel) {
            setState(prev => ({ 
              ...prev,
              channel,
              subscriptionState: 'SUBSCRIBED'
            }))
          }
          channel.unbind('pusher:subscription_succeeded', handleSuccess)
          channel.unbind('pusher:subscription_error', handleError)
          resolve(true)
        }

        const handleError = (error: Error) => {
          console.error('[ChatChannel] Subscription error', { channelName, error })
          if (currentChannel.current === channel) {
            setState(prev => ({
              ...prev,
              error: error.message,
              subscriptionState: 'ERROR'
            }))
          }
          channel.unbind('pusher:subscription_succeeded', handleSuccess)
          channel.unbind('pusher:subscription_error', handleError)
          reject(error)
        }

        channel.bind('pusher:subscription_succeeded', handleSuccess)
        channel.bind('pusher:subscription_error', handleError)
      })
    } catch (error) {
      console.error('[ChatChannel] Subscribe error', { channelId, error })
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to subscribe to chat channel',
        subscriptionState: 'ERROR'
      }))
    }
  }, [channelId, client, isConnected, state.subscriptionState, variant])

  // Auto-subscribe when connection is ready
  useEffect(() => {
    if (isConnected && channelId) {
      console.log('[ChatChannel] Connection ready, attempting subscribe', { channelId })
      subscribe()
    } else {
      console.log('[ChatChannel] Connection not ready or no channelId', { isConnected, channelId })
      unsubscribe()
    }
  }, [isConnected, channelId, subscribe, unsubscribe])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[ChatChannel] Cleaning up subscription', { channelId })
      unsubscribe()
    }
  }, [unsubscribe, channelId])

  return {
    ...state,
    subscribe,
    unsubscribe,
    clearError
  }
} 