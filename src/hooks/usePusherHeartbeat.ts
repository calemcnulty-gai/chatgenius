'use client'

import { useEffect, useRef } from 'react'
import { pusherClient } from '@/lib/pusher'

const HEARTBEAT_INTERVAL = 30000 // 30 seconds

export function usePusherHeartbeat() {
  const heartbeatRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Skip if no Pusher client (server-side or not initialized)
    if (!pusherClient) return

    // Function to send heartbeat
    const sendHeartbeat = async () => {
      if (!pusherClient) return

      try {
        const socketId = pusherClient.connection.socket_id
        if (!socketId) {
          console.warn('No socket ID available for heartbeat')
          return
        }

        // Use the current origin to construct the full URL
        const url = `${window.location.origin}/api/pusher/heartbeat`
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ socketId }),
        })

        if (!response.ok) {
          console.error('Failed to send heartbeat:', response.status)
        }
      } catch (error) {
        console.error('Error sending heartbeat:', error)
      }
    }

    // Start heartbeat when connection is established
    const handleConnected = () => {
      console.log('Starting Pusher heartbeat')
      heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL)
      sendHeartbeat() // Send initial heartbeat
    }

    // Clear heartbeat on disconnection
    const handleDisconnected = () => {
      console.log('Clearing Pusher heartbeat')
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }

    // Bind connection state handlers
    pusherClient.connection.bind('connected', handleConnected)
    pusherClient.connection.bind('disconnected', handleDisconnected)

    // If already connected, start heartbeat immediately
    if (pusherClient.connection.state === 'connected') {
      handleConnected()
    }

    // Cleanup
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
      if (!pusherClient) return
      pusherClient.connection.unbind('connected', handleConnected)
      pusherClient.connection.unbind('disconnected', handleDisconnected)
    }
  }, [])
} 