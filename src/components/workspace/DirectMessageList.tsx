'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { UserDisplay } from '@/components/ui/UserDisplay'
import { PlusIcon } from '@heroicons/react/24/outline'
import { StartDMModal } from './StartDMModal'
import { PusherEvent, NewDirectMessageEvent } from '@/types/events'
import { useUserChannel } from '@/contexts/pusher/UserChannelContext'
import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { User } from '@/types/user'
import { now } from '@/types/timestamp'

interface DMChannelMember {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  unreadCount: number;
  status?: 'active' | 'away' | 'offline';
}

interface DMChannel {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  members: DMChannelMember[];
}

type DirectMessageListProps = {
  workspaceId: string
  channels: DMChannel[]
  users: User[]
}

export function DirectMessageList({ workspaceId, channels: initialChannels, users }: DirectMessageListProps) {
  const params = useParams()
  const { user } = useUserAuth()
  const { channel: userChannel } = useUserChannel()
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
              // Update the unread count for the current user's member entry
              const updatedMembers = channel.members.map(member => {
                if (member.id === user.id) {
                  return {
                    ...member,
                    unreadCount: (member.unreadCount || 0) + 1
                  }
                }
                return member
              })

              return {
                ...channel,
                members: updatedMembers,
                updatedAt: data.createdAt
              }
            }
            return channel
          })
        } else {
          // Create new channel
          console.log(`[DirectMessageList] Creating new channel ${data.channelId}`)
          const sender = users.find(u => u.id === data.senderId) || {
            id: data.senderId,
            name: data.senderName,
            email: data.senderEmail,
            profileImage: data.senderProfileImage,
            status: 'active' as const
          }

          const newChannel: DMChannel = {
            id: data.channelId,
            workspaceId,
            createdAt: data.createdAt,
            updatedAt: data.createdAt,
            members: [
              {
                ...sender,
                unreadCount: 0
              },
              {
                id: user.id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                unreadCount: 1
              }
            ]
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
            // Reset unread count for current user's member entry
            const updatedMembers = channel.members.map(member => {
              if (member.id === user?.id) {
                return {
                  ...member,
                  unreadCount: 0
                }
              }
              return member
            })

            return {
              ...channel,
              members: updatedMembers
            }
          }
          return channel
        })
      })
    }
  }, [params.channelId, user?.id])

  // Update channels when initial data changes
  useEffect(() => {
    setChannels(initialChannels)
  }, [initialChannels])

  // Get the other user in a DM channel
  const getOtherUser = (channel: DMChannel): DMChannelMember | undefined => {
    return channel.members.find(member => member.id !== user?.id)
  }

  // Get unread count for current user in a channel
  const getCurrentUserUnreadCount = (channel: DMChannel): number => {
    const currentUserMember = channel.members.find(member => member.id === user?.id)
    return currentUserMember?.unreadCount || 0
  }

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
            const isActive = params.channelId === channel.id
            const otherUser = getOtherUser(channel)
            const unreadCount = getCurrentUserUnreadCount(channel)
            const hasUnread = !isActive && unreadCount > 0

            if (!otherUser) return null

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
                      user={users.find(u => u.id === otherUser.id) || {
                        ...otherUser,
                        displayName: otherUser.name,
                        title: null,
                        timeZone: null,
                        lastHeartbeat: null,
                        createdAt: now(),
                        updatedAt: now(),
                        status: otherUser.status || 'offline' as const,
                        isAi: false,
                      }}
                      size="sm"
                    />
                    <div
                      className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-gray-900 ${
                        otherUser.status === 'active'
                          ? 'bg-green-500'
                          : otherUser.status === 'away'
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <UserDisplay 
                    user={users.find(u => u.id === otherUser.id) || {
                      ...otherUser,
                      displayName: otherUser.name,
                      title: null,
                      timeZone: null,
                      lastHeartbeat: null,
                      createdAt: now(),
                      updatedAt: now(),
                      status: otherUser.status || 'offline' as const,
                      isAi: false,
                    }}
                    className={`truncate text-sm ${hasUnread ? 'font-semibold' : ''}`}
                  />
                </div>
                {hasUnread && unreadCount ? (
                  <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>
      </div>

      <StartDMModal
        isOpen={isStartDMModalOpen}
        onClose={() => setIsStartDMModalOpen(false)}
        workspaceId={workspaceId}
        workspaceSlug={params.workspaceSlug as string}
        users={users}
      />
    </>
  )
} 