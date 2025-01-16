'use client'

import { UserAvatar } from '@/components/ui/UserAvatar'
import { UserDisplay } from '@/components/ui/UserDisplay'
import { useUser } from '@/contexts/UserContext'
import type { DirectMessageChannelWithMembers } from '@/types/db'

interface DMChannelHeaderProps {
  channel: DirectMessageChannelWithMembers
}

export function DMChannelHeader({ channel }: DMChannelHeaderProps) {
  const { user } = useUser()
  const otherUser = channel.members.find(member => member.id !== user?.id)

  if (!otherUser) {
    return null
  }

  return (
    <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
      <div className="relative">
        <UserAvatar
          user={{
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            profileImage: otherUser.profileImage,
            clerkId: '',
            displayName: otherUser.name,
            title: null,
            timeZone: null,
            status: otherUser.status || 'offline',
            lastHeartbeat: null,
            createdAt: channel.createdAt,
            updatedAt: channel.updatedAt,
          }}
          size="md"
        />
        <div
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-800 ${
            otherUser.status === 'active'
              ? 'bg-green-500'
              : otherUser.status === 'away'
              ? 'bg-yellow-500'
              : 'bg-gray-500'
          }`}
        />
      </div>
      <div className="flex flex-col">
        <UserDisplay
          user={{
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            profileImage: otherUser.profileImage,
            clerkId: '',
            displayName: otherUser.name,
            title: null,
            timeZone: null,
            status: otherUser.status || 'offline',
            lastHeartbeat: null,
            createdAt: channel.createdAt,
            updatedAt: channel.updatedAt,
          }}
          className="text-lg font-medium text-white"
        />
        <div className="text-sm text-gray-400">
          {otherUser.status === 'active' ? 'Active' : otherUser.status === 'away' ? 'Away' : 'Offline'}
        </div>
      </div>
    </div>
  )
} 