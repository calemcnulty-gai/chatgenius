import { db } from '@/db'
import { workspaces, channels, workspaceMemberships, users, directMessageChannels, directMessageMembers, unreadMessages } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getOrCreateUser } from '@/lib/db/users'
import { 
  ChannelWithUnreadMessages, 
  ChannelWithUnreadCounts, 
  DirectMessageChannelWithUnreadMessages,
  DirectMessageChannelWithUnreadCounts,
  WorkspaceMembershipWithUser,
} from '@/types/db'
import { UserProvider } from '@/contexts/UserContext'
import { WorkspaceLayoutClient } from '@/components/workspace/WorkspaceLayoutClient'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { workspaceSlug: string }
}) {
  const { userId: clerkUserId } = auth()
  if (!clerkUserId) {
    redirect('/sign-in')
  }

  // Get the full user data from Clerk
  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect('/sign-in')
  }

  // Get or create user to get their database ID
  const dbUser = await getOrCreateUser({
    id: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    emailAddresses: clerkUser.emailAddresses,
    imageUrl: clerkUser.imageUrl,
  })

  // Ensure user has valid status and date formats
  const user = {
    ...dbUser,
    status: (dbUser.status as 'active' | 'away' | 'offline') || 'offline',
    createdAt: dbUser.createdAt.toISOString(),
    updatedAt: dbUser.updatedAt.toISOString()
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
    return {
      ...channel,
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
  }) as WorkspaceMembershipWithUser[]

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
        where: eq(unreadMessages.userId, user.id)
      }
    },
  }) as DirectMessageChannelWithUnreadMessages[]

  // Transform DM channels to include only the other user and unread counts
  const formattedDMChannels = dmChannels
    .filter(channel => channel.members.some(member => member.userId === user.id))
    .map(channel => {
      const otherUser = channel.members.find(member => member.userId !== user.id)!.user
      const unreadMessage = channel.unreadMessages?.[0]
      return {
        id: channel.id,
        workspaceId: channel.workspaceId,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name ?? '',
          profileImage: otherUser.profileImage,
          status: (otherUser.status as 'active' | 'away' | 'offline') || 'offline'
        },
        unreadCount: unreadMessage?.unreadCount ?? 0,
        hasMention: unreadMessage?.hasMention ?? false,
      }
    })

  return (
    <UserProvider initialUser={user}>
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