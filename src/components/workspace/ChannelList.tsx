'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { HashtagIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Channel } from '@/types'
import Modal from '@/components/ui/Modal'
import CreateChannel from './CreateChannel'
import { PusherEvent, NewChannelMessageEvent } from '@/types/events'
import { usePusherChannel } from '@/contexts/PusherContext'

type ChannelWithUnread = Channel & {
  hasUnread?: boolean
  hasMention?: boolean
}

type ChannelListProps = {
  channels: ChannelWithUnread[]
}

export default function ChannelList({ channels: initialChannels }: ChannelListProps) {
  const params = useParams()
  const { userId } = useAuth()
  const { userChannel } = usePusherChannel()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [channels, setChannels] = useState(initialChannels)

  // Set up event listener for channel events - this should never be cleaned up
  useEffect(() => {
    if (!userId || !userChannel) return

    console.log('[ChannelList] Setting up channel event listeners')
    
    // Listen for new channel messages
    userChannel.bind(PusherEvent.NEW_CHANNEL_MESSAGE, (data: NewChannelMessageEvent) => {
      if (data.senderId !== userId) {
        console.log(`[ChannelList] Received channel message:`, data)
        setChannels(currentChannels => {
          // Don't mark as unread if we're currently viewing this channel
          const isActiveChannel = params.channelSlug === data.channelName
          if (isActiveChannel) {
            console.log(`[ChannelList] Ignoring unread for active channel ${data.channelName}`)
            return currentChannels
          }

          return currentChannels.map(channel => {
            if (channel.id === data.channelId) {
              return {
                ...channel,
                hasUnread: true,
                hasMention: channel.hasMention || data.hasMention,
              }
            }
            return channel
          })
        })
      }
    })

    // Listen for new channels
    userChannel.bind(PusherEvent.CHANNEL_CREATED, (data: Channel) => {
      console.log(`[ChannelList] New channel created:`, data)
      setChannels(currentChannels => [...currentChannels, data])
    })

    // Listen for channel updates
    userChannel.bind(PusherEvent.CHANNEL_UPDATED, (data: Channel) => {
      console.log(`[ChannelList] Channel updated:`, data)
      setChannels(currentChannels => 
        currentChannels.map(channel => 
          channel.id === data.id ? { ...channel, ...data } : channel
        )
      )
    })

    // Listen for channel deletions
    userChannel.bind(PusherEvent.CHANNEL_DELETED, (data: { channelId: string }) => {
      console.log(`[ChannelList] Channel deleted:`, data)
      setChannels(currentChannels => 
        currentChannels.filter(channel => channel.id !== data.channelId)
      )
    })
  }, [userId, userChannel]) // Only depend on userId and userChannel

  // Handle active channel changes
  useEffect(() => {
    const currentChannelSlug = params.channelSlug
    if (currentChannelSlug) {
      console.log(`[ChannelList] Resetting unread state for active channel ${currentChannelSlug}`)
      setChannels(currentChannels =>
        currentChannels.map(channel => {
          if (channel.slug === currentChannelSlug) {
            return {
              ...channel,
              hasUnread: false,
              hasMention: false,
            }
          }
          return channel
        })
      )
    }
  }, [params.channelSlug])

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
          const hasUnread = !isActive && channel.hasUnread;

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
              {hasUnread && channel.hasMention && (
                <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  @
                </span>
              )}
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