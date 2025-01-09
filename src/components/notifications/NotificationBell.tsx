'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BellIcon } from '@heroicons/react/24/outline'
import { pusherClient } from '@/lib/pusher'
import { PusherEvent, NewChannelMessageEvent, NewDirectMessageEvent } from '@/types/events'
import { useUser } from '@/contexts/UserContext'
import { UserDisplay } from '@/components/ui/UserDisplay'

type Notification = {
  id: string
  type: 'mention' | 'thread_reply' | 'dm'
  title: string
  body?: string
  read: boolean
  createdAt: string
  data: {
    channelId: string
    messageId: string
    senderId: string
    senderName: string
    senderDisplayName: string | null
    channelName?: string
    parentMessageId?: string
  }
}

export function NotificationBell() {
  const router = useRouter()
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id || !pusherClient) return

    const userChannel = pusherClient.subscribe(`user-${user.id}`)

    // Handle new channel messages
    userChannel.bind(PusherEvent.NEW_CHANNEL_MESSAGE, (data: NewChannelMessageEvent) => {
      if (data.senderId !== user.id && data.hasMention) {
        const notification: Notification = {
          id: `${data.id}-mention`,
          type: 'mention',
          title: `mentioned you in #${data.channelName}`,
          body: data.content,
          read: false,
          createdAt: data.createdAt,
          data: {
            channelId: data.channelId,
            messageId: data.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderDisplayName: data.senderDisplayName,
            channelName: data.channelName,
            parentMessageId: data.parentMessageId || undefined
          }
        }
        setNotifications(prev => [notification, ...prev])
      }
    })

    // Handle new direct messages
    userChannel.bind(PusherEvent.NEW_DIRECT_MESSAGE, (data: NewDirectMessageEvent) => {
      if (data.senderId !== user.id) {
        const notification: Notification = {
          id: `${data.id}-dm`,
          type: 'dm',
          title: `New message`,
          body: data.content,
          read: false,
          createdAt: data.createdAt,
          data: {
            channelId: data.channelId,
            messageId: data.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderDisplayName: data.senderDisplayName,
            parentMessageId: data.parentMessageId || undefined
          }
        }
        setNotifications(prev => [notification, ...prev])
      }
    })

    return () => {
      if (!pusherClient) return
      userChannel.unbind_all()
      pusherClient.unsubscribe(`user-${user.id}`)
    }
  }, [user?.id])

  const unreadCount = notifications?.filter(n => !n.read)?.length || 0

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
                      <UserDisplay
                        user={{
                          id: notification.data.senderId,
                          name: notification.data.senderName,
                          displayName: notification.data.senderDisplayName,
                          email: '',
                          profileImage: null,
                          status: 'active',
                          timeZone: null,
                          title: null,
                          clerkId: '',
                          createdAt: '',
                          updatedAt: '',
                        }}
                      />
                      {' '}
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