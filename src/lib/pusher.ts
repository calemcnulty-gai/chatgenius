import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

console.log('Initializing Pusher client with:', {
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
})

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
)

// Add connection handlers
pusherClient.connection.bind('connecting', () => {
  console.log('Attempting to connect to Pusher...')
})

pusherClient.connection.bind('connected', () => {
  console.log('Successfully connected to Pusher')
})

pusherClient.connection.bind('disconnected', () => {
  console.log('Disconnected from Pusher')
})

pusherClient.connection.bind('error', (err: any) => {
  console.error('Pusher connection error:', err)
})

// Log the current connection state
console.log('Current Pusher connection state:', pusherClient.connection.state) 