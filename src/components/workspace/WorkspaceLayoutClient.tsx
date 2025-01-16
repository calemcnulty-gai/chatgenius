'use client'

import { useUser } from '@/contexts/UserContext'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { workspaces } from '@/db/schema'
import { ChannelWithUnreadCounts, DirectMessageChannelWithUnreadCounts, WorkspaceMembershipWithUser } from '@/types/db'
import { useMemo } from 'react'

interface WorkspaceLayoutClientProps {
  workspace: typeof workspaces.$inferSelect
  channels: ChannelWithUnreadCounts[]
  users: WorkspaceMembershipWithUser[]
  dmChannels: DirectMessageChannelWithUnreadCounts[]
  children: React.ReactNode
}

export function WorkspaceLayoutClient({
  workspace,
  channels,
  users,
  dmChannels,
  children
}: WorkspaceLayoutClientProps) {
  const { user } = useUser()

  if (!user) {
    return null
  }

  const formattedDMChannels = useMemo(() => dmChannels.map(channel => ({
    ...channel,
    otherUser: {
      id: channel.otherUser.id,
      name: channel.otherUser.name || '',
      profileImage: channel.otherUser.profileImage,
      status: channel.otherUser.status as 'active' | 'away' | 'offline' || 'offline'
    }
  })), [dmChannels])

  const formattedUsers = useMemo(() => users.map(membership => ({
    ...membership.user,
    status: membership.user.status as 'active' | 'away' | 'offline' || 'offline'
  })), [users])

  return (
    <div className="flex h-screen overflow-hidden">
      <WorkspaceSidebar
        workspace={workspace}
        channels={channels}
        users={formattedUsers}
        dmChannels={formattedDMChannels}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-end border-b border-gray-800 px-4">
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserAvatar
              user={{
                ...user,
                status: user.status as 'active' | 'away' | 'offline' || 'active'
              }}
              size="sm"
              showMenu
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
} 