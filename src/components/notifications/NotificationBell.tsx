'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { BellIcon } from '@heroicons/react/24/outline'
import { pusherClient } from '@/lib/pusher'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  read: boolean
  data: {
    channelId: string
    messageId: string
    senderId: string
  }
  createdAt: string
}

export function NotificationBell() {
  const router = useRouter()
  const { userId } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Fetch notifications on mount
  useEffect(() => {
    if (!userId) return

    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data))
  }, [userId])

  // Subscribe to notifications
  useEffect(() => {
    if (!userId) return

    // Wait for connection to be established
    if (pusherClient.connection.state !== 'connected') {
      pusherClient.connect()
    }

    const channelName = `user-${userId}`
    const channel = pusherClient.subscribe(channelName)

    // Handle connection state
    const handleConnectionStateChange = (state: string) => {
      console.log('Pusher connection state changed:', state)
      if (state === 'connected') {
        console.log('Successfully connected to Pusher')
      }
    }

    pusherClient.connection.bind('state_change', handleConnectionStateChange)

    // Listen for subscription success
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Successfully subscribed to notifications channel:', channelName)
    })

    // Listen for subscription error
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Error subscribing to notifications channel:', error)
    })

    channel.bind('new-notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
    })

    // Listen for read status updates
    channel.bind('notification-read', (data: { channelId: string }) => {
      setNotifications(prev =>
        prev.map(n =>
          n.data.channelId === data.channelId ? { ...n, read: true } : n
        )
      )
    })

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
      pusherClient.connection.unbind('state_change', handleConnectionStateChange)
    }
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleNotificationClick = async (notification: Notification) => {
    // Navigate to the channel
    router.push(`/workspace/${notification.data.channelId}`)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg bg-gray-800 p-2 shadow-lg">
          <div className="space-y-1">
            {notifications.length === 0 ? (
              <p className="p-2 text-center text-sm text-gray-400">
                No notifications
              </p>
            ) : (
              notifications.map(notification => (
                <button
                  key={`${notification.id}-${notification.createdAt}`}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative w-full rounded-md p-2 text-left hover:bg-gray-700`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                      {notification.title}
                    </div>
                    {!notification.read && (
                      <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </div>
                  {notification.body && (
                    <div className="mt-1 text-xs text-gray-400">
                      {notification.body}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
} 