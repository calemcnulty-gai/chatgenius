'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { UserList } from './UserList'
import { DirectMessageList } from './DirectMessageList'
import { PlusIcon } from '@heroicons/react/24/outline'

type Channel = {
  id: string
  name: string
  slug: string
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
  const params = useParams()
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true)

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
        <div>
          <button
            onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}
            className="mb-1 flex w-full items-center justify-between px-2 text-sm font-semibold uppercase text-gray-400 hover:text-gray-300"
          >
            <span>Channels</span>
            <PlusIcon className="h-4 w-4" />
          </button>
          {isChannelsExpanded && (
            <div className="space-y-1">
              {channels.map((channel) => (
                <Link
                  key={channel.id}
                  href={`/workspace/${workspace.slug}/channel/${channel.slug}`}
                  className={`block rounded-md px-2 py-1 text-sm ${
                    params.channelSlug === channel.slug
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                  }`}
                >
                  # {channel.name}
                </Link>
              ))}
            </div>
          )}
        </div>

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
            name: workspace.name
          }}
        />
      </div>
    </div>
  )
} 