'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { UserList } from './UserList'
import { DirectMessageList } from './DirectMessageList'
import ChannelList from './ChannelList'
import { Channel as BaseChannel, DirectMessageChannelWithUnreadCounts } from '@/types/db'
import { User } from '@/types/user'
import { memo } from 'react'
import { now } from '@/types/timestamp'
import { useUserAuth } from '@/contexts/user/UserAuthContext'

console.log('🔥 WorkspaceSidebar: File loaded')

type Channel = BaseChannel & {
  unreadCount?: number
  hasMention?: boolean
}

type WorkspaceSidebarProps = {
  workspace: {
    id: string
    name: string
    slug: string
  }
  channels: Channel[]
  users: User[]
  dmChannels: DirectMessageChannelWithUnreadCounts[]
}

function transformDMChannel(channel: DirectMessageChannelWithUnreadCounts, currentUser: User): {
  id: string
  workspaceId: string
  createdAt: string
  updatedAt: string
  members: {
    id: string
    name: string
    email: string
    profileImage: string | null
    unreadCount: number
    status?: 'active' | 'away' | 'offline'
  }[]
} {
  return {
    id: channel.id,
    workspaceId: channel.workspaceId,
    createdAt: channel.createdAt,
    updatedAt: channel.updatedAt,
    members: [
      {
        id: channel.otherUser.id,
        name: channel.otherUser.name || 'Unknown',
        email: '', // We don't have this in the unread counts format
        profileImage: channel.otherUser.profileImage,
        unreadCount: 0,
        status: channel.otherUser.status
      },
      {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        profileImage: currentUser.profileImage,
        unreadCount: channel.unreadCount,
        status: currentUser.status
      }
    ]
  }
}

function WorkspaceSidebarComponent({ workspace, channels, users, dmChannels }: WorkspaceSidebarProps) {
  const { user: currentUser } = useUserAuth()

  if (!currentUser) {
    return null
  }

  const transformedDMChannels = dmChannels.map(channel => transformDMChannel(channel, currentUser))

  console.log('🔄 WorkspaceSidebar: Rendering with channels:', channels.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    unreadCount: c.unreadCount,
    hasMention: c.hasMention
  })))

  return (
    <div className="flex h-full flex-col">
      {/* Workspace header */}
      <div className="flex h-14 items-center justify-between border-b border-gray-800 px-4">
        <h1 className="text-lg font-medium text-white">{workspace.name}</h1>
      </div>

      {/* Sidebar sections */}
      <div className="flex-1 space-y-4 overflow-y-auto p-2">
        {/* Channels section */}
        <ChannelList channels={channels} workspaceId={workspace.id} />

        {/* Direct Messages section */}
        <DirectMessageList
          workspaceId={workspace.id}
          channels={transformedDMChannels}
          users={users}
        />

        {/* Users section */}
        <UserList 
          users={users} 
          workspace={{
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug
          }}
        />
      </div>
    </div>
  )
}

export const WorkspaceSidebar = memo(WorkspaceSidebarComponent) 