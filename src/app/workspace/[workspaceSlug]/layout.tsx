import { db } from '@/db'
import { workspaces, channels, workspaceMemberships, users, directMessageChannels, directMessageMembers, unreadMessages } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const { userId } = auth()
  if (!userId) {
    redirect('/sign-in')
  }

  console.log('WorkspaceLayout: Loading workspace data for user:', userId)

  // Get workspace by slug
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, params.workspaceSlug),
  })

  if (!workspace) {
    redirect('/')
  }

  // Verify user is a member of the workspace
  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.workspaceId, workspace.id),
      eq(workspaceMemberships.userId, userId)
    ),
  })

  if (!membership) {
    redirect('/')
  }

  // Get workspace channels with unread counts
  const workspaceChannels = await db.query.channels.findMany({
    where: eq(channels.workspaceId, workspace.id),
    with: {
      unreadMessages: {
        where: eq(unreadMessages.userId, userId)
      }
    }
  })

  console.log('WorkspaceLayout: Raw channel data:', workspaceChannels.map(channel => ({
    id: channel.id,
    name: channel.name,
    unreadMessages: channel.unreadMessages
  })))

  // Transform channels to include unread counts
  const formattedChannels = workspaceChannels.map(channel => {
    const unreadMessage = channel.unreadMessages?.[0]
    console.log('WorkspaceLayout: Processing channel:', {
      channelId: channel.id,
      channelName: channel.name,
      channelSlug: channel.slug,
      unreadMessage,
      unreadCount: unreadMessage?.unreadCount ?? 0,
      hasMention: unreadMessage?.hasMention ?? false
    })
    return {
      ...channel,
      unreadCount: unreadMessage?.unreadCount ?? 0,
      hasMention: unreadMessage?.hasMention ?? false,
    }
  })

  console.log('WorkspaceLayout: Formatted channels:', formattedChannels.map(channel => ({
    id: channel.id,
    name: channel.name,
    slug: channel.slug,
    unreadCount: channel.unreadCount,
    hasMention: channel.hasMention
  })))

  // Get workspace members
  const workspaceUsers = await db.query.workspaceMemberships.findMany({
    where: eq(workspaceMemberships.workspaceId, workspace.id),
    with: {
      user: true,
    },
  })

  // Get DM channels for the current user in this workspace with unread counts
  const dmChannels = await db.query.directMessageChannels.findMany({
    where: eq(directMessageChannels.workspaceId, workspace.id),
    with: {
      members: {
        with: {
          user: true,
        },
      },
      unreadMessages: {
        where: eq(unreadMessages.userId, userId)
      }
    },
  })

  // Transform DM channels to include only the other user and unread counts
  const formattedDMChannels = dmChannels
    .filter(channel => channel.members.some(member => member.userId === userId))
    .map(channel => {
      const otherUser = channel.members.find(member => member.userId !== userId)!.user
      const unreadMessage = channel.unreadMessages?.[0]
      return {
        id: channel.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          profileImage: otherUser.profileImage,
          status: (otherUser.status as 'active' | 'away' | 'offline') || 'offline'
        },
        unreadCount: unreadMessage?.unreadCount ?? 0,
        hasMention: unreadMessage?.hasMention ?? false,
      }
    })

  return (
    <div className="flex h-screen overflow-hidden">
      <WorkspaceSidebar
        workspace={workspace}
        channels={formattedChannels}
        users={workspaceUsers.map(membership => ({
          ...membership.user,
          status: 'active', // You might want to fetch this from somewhere
        }))}
        dmChannels={formattedDMChannels}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center justify-end border-b border-gray-800 px-4">
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
} 