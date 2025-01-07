'use client'

console.log('🔥 ChannelList: File loaded')

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
  console.log('🔄 ChannelList: Component rendering', {
    initialChannels: initialChannels.map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      unreadCount: c.unreadCount
    }))
  })

  const params = useParams()
  const { userId } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [channels, setChannels] = useState(() => {
    console.log('🏗️ ChannelList: Initializing channels state')
    return initialChannels
  })

  // Debug mount status and props
  useEffect(() => {
    console.log('🚀 ChannelList: Component mounted', {
      userId,
      currentChannelSlug: params.channelSlug,
      initialChannels: initialChannels.map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        unreadCount: c.unreadCount,
        hasMention: c.hasMention
      }))
    })

    return () => {
      console.log('💫 ChannelList: Component unmounting')
    }
  }, [])

  // Create a stable event handler
  const handleNewMessage = useCallback((data: { channelId: string, channelSlug: string, hasMention?: boolean, isChannel?: boolean }) => {
    console.log('📨 ChannelList: Received new-message event:', {
      eventData: data,
      currentChannelSlug: params.channelSlug,
      currentChannels: channels.map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        unreadCount: c.unreadCount,
        hasMention: c.hasMention
      }))
    })

    if (data.isChannel) {
      setChannels(currentChannels => {
        console.log('🔄 ChannelList: Updating channels state after new message')
        const updatedChannels = currentChannels.map(channel => {
          const shouldUpdate = channel.id === data.channelId && channel.slug === data.channelSlug && params.channelSlug !== data.channelSlug
          console.log('🔍 ChannelList: Processing channel update:', {
            channelId: channel.id,
            channelSlug: channel.slug,
            channelName: channel.name,
            receivedChannelId: data.channelId,
            receivedChannelSlug: data.channelSlug,
            currentChannelSlug: params.channelSlug,
            shouldUpdate,
            currentUnreadCount: channel.unreadCount,
            slugMatch: channel.slug === data.channelSlug,
            idMatch: channel.id === data.channelId
          })

          if (shouldUpdate) {
            const newUnreadCount = (channel.unreadCount || 0) + 1
            console.log('📝 ChannelList: Updating channel unread count:', {
              channelId: channel.id,
              channelSlug: channel.slug,
              channelName: channel.name,
              oldCount: channel.unreadCount,
              newCount: newUnreadCount,
              hasMention: channel.hasMention || data.hasMention
            })
            return {
              ...channel,
              unreadCount: newUnreadCount,
              hasMention: channel.hasMention || data.hasMention || false,
            }
          }
          return channel
        })

        console.log('✅ ChannelList: Channels after update:', updatedChannels.map(c => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          unreadCount: c.unreadCount,
          hasMention: c.hasMention
        })))

        return updatedChannels
      })
    }
  }, [params.channelSlug, channels])

  // Subscribe to real-time updates
  useEffect(() => {
    console.log('🔌 ChannelList: Setting up Pusher subscription', {
      userId,
      channelName: userId ? `user-${userId}` : null
    })

    if (!userId) {
      console.log('⚠️ ChannelList: No userId, skipping Pusher setup')
      return
    }

    const channelName = `user-${userId}`
    console.log('🔄 ChannelList: Subscribing to Pusher channel:', channelName)
    const channel = pusherClient.subscribe(channelName)

    // Listen for new messages
    channel.bind('new-message', handleNewMessage)

    // Listen for notification-read events
    channel.bind('notification-read', (data: { channelId: string }) => {
      console.log('📖 ChannelList: Received notification-read event:', data)
      setChannels(currentChannels => {
        const updatedChannels = currentChannels.map(channel => {
          if (channel.id === data.channelId) {
            console.log('📝 ChannelList: Resetting unread count for channel:', {
              channelId: channel.id,
              channelName: channel.name,
              oldCount: channel.unreadCount
            })
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

    // Debug Pusher connection state
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ ChannelList: Successfully subscribed to Pusher channel:', channelName)
    })

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('❌ ChannelList: Pusher subscription error:', error)
    })

    return () => {
      console.log('🧹 ChannelList: Cleaning up Pusher subscription for channel:', channelName)
      channel.unbind('new-message', handleNewMessage)
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
    }
  }, [userId, handleNewMessage])

  // Update channels when initial data changes
  useEffect(() => {
    console.log('📥 ChannelList: Received new initialChannels:', {
      initialChannels: initialChannels.map(c => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        unreadCount: c.unreadCount,
        hasMention: c.hasMention
      }))
    })
    setChannels(initialChannels)
  }, [initialChannels])

  // Log channel state changes
  useEffect(() => {
    console.log('📊 ChannelList: Channels state updated:', channels.map(c => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      unreadCount: c.unreadCount,
      hasMention: c.hasMention
    })))
  }, [channels])

  console.log('🎨 ChannelList: Rendering channels:', channels.map(c => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    unreadCount: c.unreadCount,
    isActive: c.slug === params.channelSlug,
    hasUnread: !!(c.unreadCount && c.unreadCount > 0)
  })))

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