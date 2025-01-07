'use client'

import { useState, useEffect } from 'react'
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

  // Subscribe to real-time updates
  useEffect(() => {
    console.log('ChannelList useEffect triggered:', { userId, channelSlug: params.channelSlug })
    
    if (!userId) {
      console.log('No userId available, skipping Pusher setup')
      return
    }

    const channelName = `user-${userId}`
    console.log('Setting up Pusher subscription for channel:', channelName)

    // Subscribe to user's channel for updates
    const channel = pusherClient.subscribe(channelName)
    
    console.log('Current Pusher connection state:', pusherClient.connection.state)
    console.log('Current subscribed channels:', pusherClient.channels.channels)

    // Listen for new messages
    channel.bind('new-message', (data: { channelId: string, hasMention?: boolean, isChannel?: boolean }) => {
      console.log('Received new-message event:', {
        data,
        currentChannelSlug: params.channelSlug,
        channels: channels.map(c => ({ id: c.id, slug: c.slug }))
      })

      if (data.isChannel) {
        setChannels(currentChannels => {
          console.log('Current channels before update:', currentChannels)

          const updatedChannels = currentChannels.map(channel => {
            console.log('Checking channel:', {
              channelId: channel.id,
              receivedChannelId: data.channelId,
              channelSlug: channel.slug,
              currentChannelSlug: params.channelSlug,
              shouldUpdate: channel.id === data.channelId && params.channelSlug !== channel.slug
            })

            if (channel.id === data.channelId && params.channelSlug !== channel.slug) {
              console.log('Updating unread count for channel:', {
                channelId: channel.id,
                channelSlug: channel.slug,
                currentUnread: channel.unreadCount,
                newUnread: (channel.unreadCount || 0) + 1
              })
              return {
                ...channel,
                unreadCount: (channel.unreadCount || 0) + 1,
                hasMention: channel.hasMention || data.hasMention || false,
              }
            }
            return channel
          })

          console.log('Channels after update:', updatedChannels)
          return updatedChannels
        })
      } else {
        console.log('Ignoring non-channel message:', data)
      }
    })

    // Reset counts when viewing a channel
    const currentChannelSlug = params.channelSlug
    if (currentChannelSlug) {
      console.log('Resetting counts for channel:', currentChannelSlug)
      setChannels(currentChannels => {
        const updatedChannels = currentChannels.map(channel => {
          if (channel.slug === currentChannelSlug) {
            console.log('Resetting channel:', {
              channelId: channel.id,
              channelSlug: channel.slug,
              previousUnread: channel.unreadCount
            })
            return {
              ...channel,
              unreadCount: 0,
              hasMention: false,
            }
          }
          return channel
        })
        return updatedChannels
      })
    }

    // Listen for read status updates
    channel.bind('notification-read', (data: { channelId: string }) => {
      setChannels(currentChannels =>
        currentChannels.map(channel => {
          if (channel.id === data.channelId) {
            return {
              ...channel,
              unreadCount: 0,
              hasMention: false,
            }
          }
          return channel
        })
      )
    })

    return () => {
      console.log('Cleaning up Pusher subscription for channel:', channelName)
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [userId, params.channelSlug])

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
          const hasUnread = channel.unreadCount && channel.unreadCount > 0;

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