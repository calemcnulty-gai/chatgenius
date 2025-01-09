'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { UserDisplay } from '@/components/ui/UserDisplay'
import { PlusIcon } from '@heroicons/react/24/outline'
import { StartDMModal } from './StartDMModal'
import { PusherEvent, NewDirectMessageEvent } from '@/types/events'
import { usePusherChannel } from '@/contexts/PusherContext'
import { useUser } from '@/contexts/UserContext'
import { User } from '@/types/user'

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
  const { user } = useUser()
  const { userChannel } = usePusherChannel()
  const [isStartDMModalOpen, setIsStartDMModalOpen] = useState(false)
  const [channels, setChannels] = useState(initialChannels)

  const safeDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return new Date()
    try {
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? new Date() : date
    } catch (error) {
      return new Date()
    }
  }

  // Set up event listener for new DMs - this should never be cleaned up
  useEffect(() => {
    if (!user?.id || !userChannel) return

    console.log('[DirectMessageList] Setting up DM event listener')
    userChannel.bind(PusherEvent.NEW_DIRECT_MESSAGE, (data: NewDirectMessageEvent) => {
      if (data.senderId !== user.id) {
        console.log(`[DirectMessageList] Received DM event:`, data)
        setChannels(currentChannels => {
          // Don't increment unread count if we're currently viewing this channel
          const isActiveChannel = params.channelId === data.channelId
          if (isActiveChannel) {
            console.log(`[DirectMessageList] Ignoring unread count for active channel ${data.channelId}`)
            return currentChannels
          }

          // Find the channel if it exists
          const existingChannel = currentChannels.find(channel => channel.id === data.channelId)
          
          if (existingChannel) {
            // Update existing channel
            console.log(`[DirectMessageList] Updating existing channel ${data.channelId}`)
            return currentChannels.map(channel => {
              if (channel.id === data.channelId) {
                return {
                  ...channel,
                  unreadCount: (channel.unreadCount || 0) + 1,
                  hasMention: data.hasMention,
                }
              }
              return channel
            })
          } else {
            // Create new channel
            console.log(`[DirectMessageList] Creating new channel ${data.channelId}`)
            const newChannel: DMChannel = {
              id: data.channelId,
              otherUser: {
                id: data.senderId,
                clerkId: data.senderClerkId,
                name: data.senderName,
                email: data.senderEmail,
                profileImage: data.senderProfileImage,
                displayName: data.senderDisplayName,
                title: data.senderTitle,
                timeZone: data.senderTimeZone,
                status: 'active', // They're active since they just sent a message
                createdAt: safeDate(data.senderCreatedAt).toISOString(),
                updatedAt: safeDate(data.senderUpdatedAt).toISOString(),
              },
              unreadCount: 1,
              hasMention: data.hasMention,
            }
            return [...currentChannels, newChannel]
          }
        })
      }
    })

    return () => {
      if (!userChannel) return
      userChannel.unbind(PusherEvent.NEW_DIRECT_MESSAGE)
    }
  }, [user?.id, userChannel, params.channelId])

  // Handle active channel changes
  useEffect(() => {
    const currentChannelId = params.channelId
    if (currentChannelId) {
      console.log(`[DirectMessageList] Resetting unread count for active channel ${currentChannelId}`)
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
  }, [params.channelId])

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
            const hasUnread = !isActive && channel.unreadCount && channel.unreadCount > 0;

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
                      user={channel.otherUser}
                      size="sm"
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
                  <UserDisplay 
                    user={channel.otherUser}
                    className={`truncate text-sm ${hasUnread ? 'font-semibold' : ''}`}
                  />
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