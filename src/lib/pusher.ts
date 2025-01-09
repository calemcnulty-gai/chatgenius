import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// Create a singleton instance for the client
let pusherClientInstance: PusherClient | undefined

export function initPusherClient() {
  if (typeof window === 'undefined') return undefined
  
  if (!pusherClientInstance) {
    console.log('Initializing Pusher client with:', {
      key: process.env.NEXT_PUBLIC_PUSHER_KEY,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    })

    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    })

    // Debug connection state changes
    pusherClientInstance.connection.bind('state_change', ({ current, previous }: { current: string, previous: string }) => {
      console.log('Pusher: Connection state changed:', {
        previous,
        current,
        connectionState: pusherClientInstance!.connection.state,
      })
    })

    pusherClientInstance.connection.bind('connected', () => {
      console.log('Pusher: Successfully connected')
    })

    pusherClientInstance.connection.bind('error', (error: any) => {
      console.error('Pusher: Connection error:', error)
    })

    // Log the current connection state
    console.log('Current Pusher connection state:', pusherClientInstance.connection.state)
  }

  return pusherClientInstance
}

// Utility function to disconnect and cleanup Pusher
export function disconnectPusher() {
  if (!pusherClientInstance) return

  // Unsubscribe from all channels
  Object.keys(pusherClientInstance.channels.channels).forEach(channelName => {
    pusherClientInstance!.unsubscribe(channelName)
  })
  
  // Disconnect the client
  pusherClientInstance.disconnect()
  pusherClientInstance = undefined
  
  console.log('Pusher: Disconnected and cleaned up all channels')
}

// Export the singleton instance
export const pusherClient = typeof window !== 'undefined' ? initPusherClient() : undefined 