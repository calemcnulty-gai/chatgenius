'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { UserList } from './UserList'
import { DirectMessageList } from './DirectMessageList'
import ChannelList from './ChannelList'
import { Channel as BaseChannel } from '@/types'

console.log('🔥 WorkspaceSidebar: File loaded')

type Channel = BaseChannel & {
  unreadCount?: number
  hasMention?: boolean
}

type User = {
  id: string
  name: string
  profileImage: string | null
  status: 'active' | 'away' | 'offline'
}

type DMChannel = {
  id: string
  otherUser: User
}

type WorkspaceSidebarProps = {
  workspace: {
    id: string
    name: string
    slug: string
  }
  channels: Channel[]
  users: User[]
  dmChannels: DMChannel[]
}

export function WorkspaceSidebar({ workspace, channels, users, dmChannels }: WorkspaceSidebarProps) {
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
        <UserButton />
      </div>

      {/* Sidebar sections */}
      <div className="flex-1 space-y-4 overflow-y-auto p-2">
        {/* Channels section */}
        <ChannelList channels={channels} />

        {/* Direct Messages section */}
        <DirectMessageList
          workspaceId={workspace.id}
          channels={dmChannels}
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