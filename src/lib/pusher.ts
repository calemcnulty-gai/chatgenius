import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// Only initialize the client on the browser
let pusherClient: PusherClient | undefined

if (typeof window !== 'undefined') {
  console.log('Initializing Pusher client with:', {
    key: process.env.NEXT_PUBLIC_PUSHER_KEY,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  })

  pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: '/api/pusher/auth',
    auth: {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  })

  // Debug connection state changes
  const client = pusherClient // Create a stable reference for the event handlers
  client.connection.bind('state_change', ({ current, previous }: { current: string, previous: string }) => {
    console.log('Pusher: Connection state changed:', {
      previous,
      current,
      connectionState: client.connection.state,
    })
  })

  client.connection.bind('connected', () => {
    console.log('Pusher: Successfully connected')
  })

  client.connection.bind('error', (error: any) => {
    console.error('Pusher: Connection error:', error)
  })

  // Log the current connection state
  console.log('Current Pusher connection state:', client.connection.state)
}

// Utility function to disconnect and cleanup Pusher
export function disconnectPusher() {
  if (!pusherClient) return

  // Unsubscribe from all channels
  Object.keys(pusherClient.channels.channels).forEach(channelName => {
    pusherClient!.unsubscribe(channelName)
  })
  
  // Disconnect the client
  pusherClient.disconnect()
  
  console.log('Pusher: Disconnected and cleaned up all channels')
}

// Export a safe version of the client that throws if accessed on the server
export const getPusherClient = () => {
  if (!pusherClient) {
    throw new Error('PusherClient is not available on the server side')
  }
  return pusherClient
} 