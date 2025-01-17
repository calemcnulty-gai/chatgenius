import { db } from '@/db'
import { workspaces, channels, workspaceMemberships, users, directMessageChannels, directMessageMembers, unreadMessages } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { 
  ChannelWithUnreadMessages, 
  ChannelWithUnreadCounts, 
  DirectMessageChannelWithUnreadMessages,
  DirectMessageChannelWithUnreadCounts,
  WorkspaceMembershipWithUser,
  DirectMessageMember,
} from '@/types/db'
import { User } from '@/types/user'
import { UserProvider } from '@/contexts/UserContext'
import { WorkspaceLayoutClient } from '@/components/workspace/WorkspaceLayoutClient'
import { Timestamp } from '@/types/timestamp'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) {
    redirect('/sign-in')
  }

  // Get user from database
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })
  if (!dbUser) {
    redirect('/sign-in')
  }

  const user: User = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    profileImage: dbUser.profileImage,
    displayName: dbUser.displayName,
    title: dbUser.title,
    timeZone: dbUser.timeZone,
    status: dbUser.isAi ? 'active' : (dbUser.status || 'offline') as 'offline' | 'active' | 'away',
    isAi: dbUser.isAi,
    lastHeartbeat: dbUser.lastHeartbeat,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  }

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
      eq(workspaceMemberships.userId, user.id)
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
        where: eq(unreadMessages.userId, user.id)
      }
    }
  }) as unknown as ChannelWithUnreadMessages[]

  // Transform channels to include unread counts
  const formattedChannels = workspaceChannels.map(channel => {
    const unreadMessage = channel.unreadMessages?.[0]
    const { unreadMessages, ...channelWithoutUnread } = channel
    return {
      ...channelWithoutUnread,
      type: channel.type as 'public' | 'private',
      unreadCount: unreadMessage?.unreadCount ?? 0,
      hasMention: unreadMessage?.hasMention ?? false,
    }
  })

  // Get workspace members
  const workspaceUsers = await db.query.workspaceMemberships.findMany({
    where: eq(workspaceMemberships.workspaceId, workspace.id),
    with: {
      user: true,
    },
  }) as unknown as WorkspaceMembershipWithUser[]

  // Get DM channels
  type DMChannelWithUserMembers = Omit<DirectMessageChannelWithUnreadMessages, 'members'> & {
    members: Array<DirectMessageMember & {
      user: User
    }>
  }

  const dmChannels = await db.query.directMessageChannels.findMany({
    where: eq(directMessageChannels.workspaceId, workspace.id),
    with: {
      members: {
        with: {
          user: true,
        },
      },
      unreadMessages: {
        where: eq(unreadMessages.userId, user.id)
      }
    },
  }) as unknown as DMChannelWithUserMembers[]

  // Transform DM channels to include only the other user and unread counts
  const formattedDMChannels = dmChannels
    .filter(channel => channel.members.some(member => member.user.id === user.id))
    .map(channel => {
      const otherMember = channel.members.find(member => member.user.id !== user.id)
      if (!otherMember) return null
      const unreadMessage = channel.unreadMessages?.[0]
      return {
        id: channel.id,
        workspaceId: channel.workspaceId,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        otherUser: {
          id: otherMember.user.id,
          name: otherMember.user.name ?? '',
          profileImage: otherMember.user.profileImage,
          status: otherMember.user.isAi ? 'active' : ((otherMember.user.status as 'active' | 'away' | 'offline') || 'offline')
        },
        unreadCount: unreadMessage?.unreadCount ?? 0,
        hasMention: unreadMessage?.hasMention ?? false,
      }
    })
    .filter((channel): channel is NonNullable<typeof channel> => channel !== null)

  return (
    <UserProvider>
      <WorkspaceLayoutClient
        workspace={workspace}
        channels={formattedChannels}
        users={workspaceUsers}
        dmChannels={formattedDMChannels}
      >
        {children}
      </WorkspaceLayoutClient>
    </UserProvider>
  )
} 