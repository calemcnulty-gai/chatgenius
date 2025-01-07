'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { PlusIcon } from '@heroicons/react/24/outline'
import { StartDMModal } from './StartDMModal'
import { pusherClient } from '@/lib/pusher'

type User = {
  id: string
  name: string
  profileImage: string | null
  status: 'active' | 'away' | 'offline'
}

type DMChannel = {
  id: string
  otherUser: User
  unreadCount?: number
  hasMention?: boolean
}

type DirectMessageListProps = {
  workspaceId: string
  channels: DMChannel[]
  users: User[]
}

export function DirectMessageList({ workspaceId, channels: initialChannels, users }: DirectMessageListProps) {
  const params = useParams()
  const { userId } = useAuth()
  const [isStartDMModalOpen, setIsStartDMModalOpen] = useState(false)
  const [channels, setChannels] = useState(initialChannels)

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return

    // Subscribe to user's channel for updates
    const channel = pusherClient.subscribe(`user-${userId}`)

    // Listen for new messages
    channel.bind('new-message', (data: { channelId: string }) => {
      setChannels(currentChannels => 
        currentChannels.map(channel => {
          if (channel.id === data.channelId) {
            return {
              ...channel,
              unreadCount: (channel.unreadCount || 0) + 1,
              hasMention: true, // DMs are always mentions
            }
          }
          return channel
        })
      )
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
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [userId, params.channelId])

  // Update channels when initial data changes
  useEffect(() => {
    setChannels(initialChannels)
  }, [initialChannels])

  return (
    <>
      <div className="flex flex-col">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-sm font-semibold uppercase text-gray-400">Direct Messages</h2>
          <button
            onClick={() => setIsStartDMModalOpen(true)}
            className="text-gray-400 hover:text-gray-300"
            title="Start a DM"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          {channels.map((channel) => {
            const isActive = params.channelId === channel.id;
            const hasUnread = channel.unreadCount && channel.unreadCount > 0;

            return (
              <Link
                key={channel.id}
                href={`/workspace/${params.workspaceSlug}/dm/${channel.id}`}
                className={`group flex items-center justify-between rounded-md px-2 py-1 ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : hasUnread
                    ? 'text-white hover:bg-gray-800'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex-shrink-0">
                    <UserAvatar
                      name={channel.otherUser.name}
                      image={channel.otherUser.profileImage}
                      className="h-4 w-4"
                    />
                    <div
                      className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-gray-900 ${
                        channel.otherUser.status === 'active'
                          ? 'bg-green-500'
                          : channel.otherUser.status === 'away'
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <span className={`truncate text-sm ${hasUnread ? 'font-semibold' : ''}`}>
                    {channel.otherUser.name}
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
      </div>

      <StartDMModal
        isOpen={isStartDMModalOpen}
        onClose={() => setIsStartDMModalOpen(false)}
        workspaceId={workspaceId}
        users={users}
      />
    </>
  )
} 