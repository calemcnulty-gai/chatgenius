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
import { DirectMessageChannelWithUnreadCounts } from '@/types/db'
import { User } from '@/types/user'
import { now } from '@/types/timestamp'

type DirectMessageListProps = {
  workspaceId: string
  channels: DirectMessageChannelWithUnreadCounts[]
  users: User[]
}

export function DirectMessageList({ workspaceId, channels: initialChannels, users }: DirectMessageListProps) {
  const params = useParams()
  const { user } = useUser()
  const { userChannel } = usePusherChannel()
  const [isStartDMModalOpen, setIsStartDMModalOpen] = useState(false)
  const [channels, setChannels] = useState(initialChannels)

  // Set up event listener for new DMs
  useEffect(() => {
    if (!user?.id || !userChannel) return

    console.log('[DirectMessageList] Setting up DM event listener', {
      userId: user.id,
      channelName: userChannel.name
    })
    
    const handleNewDirectMessage = (data: NewDirectMessageEvent) => {
      console.log('[DirectMessageList] Raw DM event received:', {
        eventData: data,
        currentUserId: user.id,
        currentChannelId: params.channelId
      })

      if (data.senderId === user.id) {
        console.log(`[DirectMessageList] Ignoring own message from ${data.senderId}`)
        return
      }

      setChannels(currentChannels => {
        // Don't increment unread count if we're currently viewing this channel
        const isActiveChannel = params.channelId === data.channelId
        console.log('[DirectMessageList] Active channel check:', {
          paramsChannelId: params.channelId,
          messageChannelId: data.channelId,
          isActiveChannel,
          params
        })
        if (isActiveChannel) {
          console.log(`[DirectMessageList] Skipping update for active channel ${data.channelId}`)
          return currentChannels
        }

        // Find the channel if it exists
        const existingChannel = currentChannels.find(channel => channel.id === data.channelId)
        
        if (existingChannel) {
          console.log(`[DirectMessageList] Updating existing channel ${data.channelId}`)
          return currentChannels.map(channel => {
            if (channel.id === data.channelId) {
              return {
                ...channel,
                unreadCount: (channel.unreadCount || 0) + 1,
                hasMention: true, // DMs always count as mentions
                updatedAt: data.createdAt // Update the channel's timestamp
              }
            }
            return channel
          })
        } else {
          // Create new channel
          console.log(`[DirectMessageList] Creating new channel ${data.channelId}`)
          const otherUser = users.find(u => u.id === data.senderId) || {
            id: data.senderId,
            name: data.senderName,
            profileImage: data.senderProfileImage,
            status: 'active'
          }
          const newChannel: DirectMessageChannelWithUnreadCounts = {
            id: data.channelId,
            workspaceId,
            createdAt: data.createdAt,
            updatedAt: data.createdAt,
            otherUser,
            unreadCount: 1,
            hasMention: true
          }
          return [...currentChannels, newChannel]
        }
      })
    }

    userChannel.bind(PusherEvent.NEW_DIRECT_MESSAGE, handleNewDirectMessage)
    console.log('[DirectMessageList] Event listener bound')

    return () => {
      console.log('[DirectMessageList] Cleaning up event listener')
      userChannel.unbind(PusherEvent.NEW_DIRECT_MESSAGE, handleNewDirectMessage)
    }
  }, [user?.id, userChannel, workspaceId, users])

  // Handle active channel changes in a separate effect
  useEffect(() => {
    const currentChannelId = params.channelId
    if (currentChannelId) {
      // Update local state immediately for smooth UI
      setChannels(currentChannels => {
        return currentChannels.map(channel => {
          if (channel.id === currentChannelId) {
            return {
              ...channel,
              unreadCount: 0,
              hasMention: false,
            }
          }
          return channel
        })
      })
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
                      user={users.find(u => u.id === channel.otherUser.id) || {
                        ...channel.otherUser,
                        name: channel.otherUser.name || 'Unknown User',
                        clerkId: '',
                        email: '',
                        displayName: channel.otherUser.name || 'Unknown User',
                        title: null,
                        timeZone: null,
                        lastHeartbeat: null,
                        createdAt: now(),
                        updatedAt: now(),
                      }}
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
                    user={users.find(u => u.id === channel.otherUser.id) || {
                      ...channel.otherUser,
                      name: channel.otherUser.name || 'Unknown User',
                      clerkId: '',
                      email: '',
                      displayName: channel.otherUser.name || 'Unknown User',
                      title: null,
                      timeZone: null,
                      lastHeartbeat: null,
                      createdAt: now(),
                      updatedAt: now(),
                    }}
                    className={`truncate text-sm ${hasUnread ? 'font-semibold' : ''}`}
                  />
                </div>
                {hasUnread && channel.unreadCount ? (
                  <span className={`ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                    channel.hasMention ? 'bg-red-500' : 'bg-red-500'
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