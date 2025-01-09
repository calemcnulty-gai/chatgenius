'use client'

import { useUser } from '@/contexts/UserContext'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { workspaces } from '@/db/schema'
import { ChannelWithUnreadCounts, DirectMessageChannelWithUnreadCounts, WorkspaceMembershipWithUser } from '@/types/db'

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

  const formattedDMChannels = dmChannels.map(channel => ({
    id: channel.id,
    otherUser: {
      id: channel.otherUser.id,
      name: channel.otherUser.name || '',
      profileImage: channel.otherUser.profileImage,
      status: channel.otherUser.status
    }
  }))

  return (
    <div className="flex h-screen overflow-hidden">
      <WorkspaceSidebar
        workspace={workspace}
        channels={channels}
        users={users.map(membership => ({
          id: membership.user.id,
          name: membership.user.name ?? '',
          profileImage: membership.user.profileImage,
          status: membership.user.status as 'active' | 'away' | 'offline' || 'offline',
        }))}
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