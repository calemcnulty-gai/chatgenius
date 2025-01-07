import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

console.log('Initializing Pusher client with:', {
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
})

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  authEndpoint: '/api/pusher/auth',
})

console.log('Pusher: Initializing client with:', {
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
})

// Debug connection state changes
pusherClient.connection.bind('state_change', ({ current, previous }: { current: string, previous: string }) => {
  console.log('Pusher: Connection state changed:', {
    previous,
    current,
    connectionState: pusherClient.connection.state,
  })
})

pusherClient.connection.bind('connected', () => {
  console.log('Pusher: Successfully connected')
})

pusherClient.connection.bind('error', (error: any) => {
  console.error('Pusher: Connection error:', error)
})

// Log the current connection state
console.log('Current Pusher connection state:', pusherClient.connection.state) 