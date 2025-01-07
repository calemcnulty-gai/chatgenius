'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { HashtagIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Channel } from '@/types'
import Modal from '@/components/ui/Modal'
import CreateChannel from './CreateChannel'
import { pusherClient } from '@/lib/pusher'

type ChannelWithUnread = Channel & {
  unreadCount?: number
  hasMention?: boolean
}

type ChannelListProps = {
  channels: ChannelWithUnread[]
}

export default function ChannelList({ channels: initialChannels }: ChannelListProps) {
  const params = useParams()
  const { userId } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [channels, setChannels] = useState(initialChannels)

  // Create a stable event handler
  const handleNewMessage = useCallback((data: { channelId: string, channelSlug: string, hasMention?: boolean, isChannel?: boolean }) => {
    if (data.isChannel) {
      setChannels(currentChannels => {
        const updatedChannels = currentChannels.map(channel => {
          const shouldUpdate = channel.id === data.channelId && channel.slug === data.channelSlug && params.channelSlug !== data.channelSlug
          
          if (shouldUpdate) {
            const newUnreadCount = (channel.unreadCount || 0) + 1
            return {
              ...channel,
              unreadCount: newUnreadCount,
              hasMention: channel.hasMention || data.hasMention || false,
            }
          }
          return channel
        })
        return updatedChannels
      })
    }
  }, [params.channelSlug, channels])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return

    const channelName = `user-${userId}`
    const channel = pusherClient.subscribe(channelName)

    // Listen for new messages
    channel.bind('new-message', handleNewMessage)

    // Listen for notification-read events
    channel.bind('notification-read', (data: { channelId: string }) => {
      setChannels(currentChannels => {
        const updatedChannels = currentChannels.map(channel => {
          if (channel.id === data.channelId) {
            return {
              ...channel,
              unreadCount: 0,
              hasMention: false
            }
          }
          return channel
        })
        return updatedChannels
      })
    })

    return () => {
      channel.unbind('new-message', handleNewMessage)
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
    }
  }, [userId, handleNewMessage])

  // Update channels when initial data changes
  useEffect(() => {
    setChannels(initialChannels)
  }, [initialChannels])

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold text-gray-400">Channels</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-gray-400 hover:text-gray-200"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1 px-1">
        {channels.map((channel) => {
          const isActive = channel.slug === params.channelSlug;
          const hasUnread = !!(channel.unreadCount && channel.unreadCount > 0);

          return (
            <Link
              key={channel.id}
              href={`/workspace/${params.workspaceSlug}/channel/${channel.slug}`}
              className={`
                flex items-center justify-between rounded-md px-2 py-1.5
                ${isActive
                  ? 'bg-gray-800 text-gray-200'
                  : hasUnread
                  ? 'text-white hover:bg-gray-800'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-x-2">
                <HashtagIcon className="h-4 w-4" />
                <span className={`${hasUnread ? 'font-semibold' : ''}`}>
                  {channel.name}
                </span>
              </div>
              {hasUnread && channel.unreadCount ? (
                <span className={`ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                  channel.hasMention ? 'bg-red-500' : 'bg-gray-600'
                } text-white`}>
                  {channel.unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Channel"
      >
        <CreateChannel
          workspaceId={params.workspaceSlug as string}
          onComplete={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  )
} 