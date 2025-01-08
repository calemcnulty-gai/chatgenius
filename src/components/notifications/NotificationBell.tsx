'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { BellIcon } from '@heroicons/react/24/outline'
import { getPusherClient } from '@/lib/pusher'

export function NotificationBell() {
  const { user } = useUser()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user?.id) return

    // Get the Pusher client
    const pusherClient = getPusherClient()

    const channelName = `user-${user.id}`

    // Ensure connection is established
    if (pusherClient.connection.state !== 'connected') {
      pusherClient.connect()
    }

    const channel = pusherClient.subscribe(channelName)

    // Handle connection state changes
    const handleConnectionStateChange = ({ current }: { current: string }) => {
      console.log(`[NotificationBell] Pusher connection state changed to: ${current}`)
    }

    pusherClient.connection.bind('state_change', handleConnectionStateChange)

    // Listen for new notifications
    channel.bind('new-notification', (data: any) => {
      console.log('[NotificationBell] Received new notification:', data)
      setUnreadCount(prev => prev + 1)
    })

    // Listen for notification read events
    channel.bind('notification-read', () => {
      setUnreadCount(0)
    })

    return () => {
      channel.unbind_all()
      pusherClient.connection.unbind('state_change', handleConnectionStateChange)
      pusherClient.unsubscribe(channelName)
    }
  }, [user?.id])

  return (
    <div className="relative">
      <BellIcon className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </div>
  )
} 