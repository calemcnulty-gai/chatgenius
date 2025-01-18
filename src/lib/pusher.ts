import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

export const pusher = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    enabledTransports: ['ws', 'wss'],
    forceTLS: true,
  }
)

// Log all events for debugging
pusherClient.bind_global((eventName: string, data: any) => {
  console.log('[Pusher] Global event received:', {
    event: eventName,
    data,
    connectionState: pusherClient.connection.state,
    socketId: pusherClient.connection.socket_id
  })
})

pusherClient.connection.bind('state_change', (states: { current: string; previous: string }) => {
  console.log('[Pusher] Connection state changed:', states)
})

pusherClient.connection.bind('error', (error: any) => {
  console.error('[Pusher] Connection error:', error)
})

pusherClient.connection.bind('connected', () => {
  console.log('[Pusher] Connected with socket ID:', pusherClient.connection.socket_id)
}) 