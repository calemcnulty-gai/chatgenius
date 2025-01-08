'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { PlusIcon } from '@heroicons/react/24/outline'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { StartDMModal } from './StartDMModal'
import { getPusherClient } from '@/lib/pusher'

type User = {
  id: string
  name: string
  profileImage: string | null
  status: 'active' | 'away' | 'offline'
}

type Channel = {
  id: string
  userId1: string
  userId2: string
  unreadCount?: number
  hasMention?: boolean
}

type DirectMessageListProps = {
  workspaceId: string
  channels: Channel[]
  users: User[]
}

export function DirectMessageList({ workspaceId, channels: initialChannels, users }: DirectMessageListProps) {
  const { user } = useUser()
  const params = useParams()
  const [isStartDMModalOpen, setIsStartDMModalOpen] = useState(false)
  const [channels, setChannels] = useState(initialChannels)
  const dmChannelSubscriptionsRef = useRef<Record<string, any>>({})

  useEffect(() => {
    if (!user?.id) return

    // Get the Pusher client
    const pusherClient = getPusherClient()

    const userChannelName = `user-${user.id}`
    console.log(`[DirectMessageList] Subscribing to user channel: ${userChannelName}`)

    // Subscribe to user's channel for updates
    const userChannel = pusherClient.subscribe(userChannelName)

    // Subscribe to all DM channels
    channels.forEach(channel => {
      const channelName = `channel-${channel.id}`
      if (!dmChannelSubscriptionsRef.current[channelName]) {
        console.log(`[DirectMessageList] Subscribing to DM channel: ${channelName}`)
        dmChannelSubscriptionsRef.current[channelName] = pusherClient.subscribe(channelName)
      }
    })

    // Wait for user channel subscription to be ready
    const handleUserSubscriptionSucceeded = () => {
      console.log(`[DirectMessageList] Successfully subscribed to ${userChannelName}`)
      
      // Listen for new messages
      userChannel.bind('new-message', (data: { 
        channelId: string, 
        messageId: string,
        senderId: string,
        hasMention: boolean,
        isDM: boolean,
        isThreadReply: boolean 
      }) => {
        console.log(`[DirectMessageList] Received new-message event on user channel:`, data)
        if (data.isDM && data.senderId !== user.id) {
          console.log(`[DirectMessageList] Updating unread count for channel ${data.channelId}`)
          setChannels(currentChannels => 
            currentChannels.map(channel => {
              if (channel.id === data.channelId) {
                return {
                  ...channel,
                  unreadCount: (channel.unreadCount || 0) + 1,
                  hasMention: data.hasMention,
                }
              }
              return channel
            })
          )
        }
      })
    }

    userChannel.bind('pusher:subscription_succeeded', handleUserSubscriptionSucceeded)

    // Handle subscription errors
    userChannel.bind('pusher:subscription_error', (error: any) => {
      console.error(`[DirectMessageList] Subscription error for ${userChannelName}:`, error)
    })

    // Reset counts when viewing a channel
    const currentChannelId = params.channelId
    if (currentChannelId) {
      setChannels(currentChannels =>
        currentChannels.map(channel => {
          if (channel.id === currentChannelId) {
            return {
              ...channel,
              unreadCount: 0,
              hasMention: false,
            }
          }
          return channel
        })
      )
    }

    return () => {
      console.log(`[DirectMessageList] Cleaning up subscriptions`)
      userChannel.unbind('pusher:subscription_succeeded', handleUserSubscriptionSucceeded)
      userChannel.unbind_all()
      pusherClient.unsubscribe(userChannelName)

      // Clean up DM channel subscriptions
      Object.entries(dmChannelSubscriptionsRef.current).forEach(([channelName, channel]) => {
        channel.unbind_all()
        pusherClient.unsubscribe(channelName)
      })
      dmChannelSubscriptionsRef.current = {}
    }
  }, [user?.id, channels, params.channelId])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-sm font-semibold text-gray-400">Direct Messages</h2>
        <button
          onClick={() => setIsStartDMModalOpen(true)}
          className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1">
        {channels.map(channel => {
          const otherUserId = channel.userId1 === user?.id ? channel.userId2 : channel.userId1
          const otherUser = users.find(u => u.id === otherUserId)
          if (!otherUser) return null

          const isActive = params.channelId === channel.id

          return (
            <Link
              key={channel.id}
              href={`/workspace/${workspaceId}/dm/${channel.id}`}
              className={`flex items-center space-x-2 rounded px-2 py-1 ${
                isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <UserAvatar
                name={otherUser.name}
                image={otherUser.profileImage}
                className="h-5 w-5"
              />
              <span className="flex-1 truncate">{otherUser.name}</span>
              {(channel.unreadCount ?? 0) > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-medium text-white">
                  {channel.unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <StartDMModal
        isOpen={isStartDMModalOpen}
        onClose={() => setIsStartDMModalOpen(false)}
        workspaceId={workspaceId}
        users={users}
      />
    </div>
  )
} 