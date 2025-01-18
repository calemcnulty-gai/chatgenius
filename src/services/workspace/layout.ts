import { db } from '@/db'
import { workspaces, channels, workspaceMemberships, users, directMessageChannels, directMessageMembers, unreadMessages } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { User } from '@/types/user'
import { ValidationError, WorkspaceLayoutData } from '@/types/workspace/layout'
import { ChannelWithUnreadMessages, WorkspaceMembershipWithUser, DirectMessageMember, DirectMessageChannelWithUnreadCounts } from '@/types/db'
import { Timestamp } from '@/types/timestamp'

export async function getUserAndValidate(userId: string): Promise<User> {
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId)
  })
  
  if (!dbUser) {
    throw { message: 'User not found', redirect: '/sign-in' } as ValidationError
  }

  return {
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
}

export async function getAndValidateWorkspace(slug: string, userId: string) {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
  })

  if (!workspace) {
    throw { message: 'Workspace not found', redirect: '/' } as ValidationError
  }

  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.workspaceId, workspace.id),
      eq(workspaceMemberships.userId, userId)
    ),
  })

  if (!membership) {
    throw { message: 'Not a member of workspace', redirect: '/' } as ValidationError
  }

  return workspace
}

export async function getWorkspaceChannels(workspaceId: string, userId: string) {
  const workspaceChannels = await db.query.channels.findMany({
    where: eq(channels.workspaceId, workspaceId),
    with: {
      unreadMessages: {
        where: eq(unreadMessages.userId, userId)
      }
    }
  }) as unknown as ChannelWithUnreadMessages[]

  return workspaceChannels.map(channel => {
    const unreadMessage = channel.unreadMessages?.[0]
    const { unreadMessages, ...channelWithoutUnread } = channel
    return {
      ...channelWithoutUnread,
      type: channel.type as 'public' | 'private',
      unreadCount: unreadMessage?.unreadCount ?? 0,
      hasMention: unreadMessage?.hasMention ?? false,
    }
  })
}

export async function getWorkspaceMembers(workspaceId: string) {
  return await db.query.workspaceMemberships.findMany({
    where: eq(workspaceMemberships.workspaceId, workspaceId),
    with: {
      user: true,
    },
  }) as unknown as WorkspaceMembershipWithUser[]
}

export async function getDMChannels(workspaceId: string, userId: string): Promise<DirectMessageChannelWithUnreadCounts[]> {
  type DMChannelWithUserMembers = {
    id: string
    workspaceId: string
    createdAt: Timestamp
    updatedAt: Timestamp
    members: Array<DirectMessageMember & {
      user: User
    }>
    unreadMessages: Array<{ unreadCount: number, hasMention: boolean }>
  }

  const dmChannels = await db.query.directMessageChannels.findMany({
    where: eq(directMessageChannels.workspaceId, workspaceId),
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
  }) as unknown as DMChannelWithUserMembers[]

  return dmChannels
    .filter(channel => channel.members.some(member => member.user.id === userId))
    .map(channel => {
      const otherMember = channel.members.find(member => member.user.id !== userId)
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
}

export async function getWorkspaceLayoutData(workspaceSlug: string, userId: string): Promise<WorkspaceLayoutData> {
  const user = await getUserAndValidate(userId)
  const workspace = await getAndValidateWorkspace(workspaceSlug, userId)
  
  const [channels, users, dmChannels] = await Promise.all([
    getWorkspaceChannels(workspace.id, userId),
    getWorkspaceMembers(workspace.id),
    getDMChannels(workspace.id, userId)
  ])

  return {
    workspace,
    channels,
    users,
    dmChannels
  }
} 