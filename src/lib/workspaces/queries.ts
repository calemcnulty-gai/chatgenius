import { db } from '@/db'
import { workspaces, workspaceMemberships, channels, directMessageChannels, directMessageMembers, unreadMessages, users } from '@/db/schema'
import { and, eq, asc, desc } from 'drizzle-orm'
import { now } from '@/types/timestamp'
import { generateSlug } from '@/lib/utils'
import type {
  DBWorkspace,
  DBWorkspaceMembership,
  DBChannel,
  DBDirectMessageChannel,
  CreateWorkspaceParams,
  CreateChannelParams,
  CreateDMChannelParams,
  WorkspaceUser,
  DMChannel,
  DBUser
} from './types'

export async function createWorkspace(params: CreateWorkspaceParams): Promise<DBWorkspace> {
  return await db.transaction(async (tx) => {
    // Create the workspace
    const [workspace] = await tx.insert(workspaces).values({
      name: params.name,
      slug: generateSlug(params.name),
      ownerId: params.userId,
      createdAt: now(),
      updatedAt: now(),
    }).returning()

    // Create the owner membership
    await tx.insert(workspaceMemberships).values({
      userId: params.userId,
      workspaceId: workspace.id,
      role: 'owner',
      createdAt: now(),
      updatedAt: now(),
    })

    // Create default general channel
    await tx.insert(channels).values({
      name: 'general',
      slug: 'general',
      workspaceId: workspace.id,
      type: 'public',
      createdAt: now(),
      updatedAt: now(),
    })

    return workspace
  })
}

export async function findWorkspaceById(id: string): Promise<DBWorkspace | undefined> {
  return await db.query.workspaces.findFirst({
    where: eq(workspaces.id, id),
  })
}

export async function findWorkspaceBySlug(slug: string): Promise<DBWorkspace | undefined> {
  return await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
  })
}

export async function getUserWorkspaces(userId: string): Promise<DBWorkspace[]> {
  const memberships = await db.query.workspaceMemberships.findMany({
    where: eq(workspaceMemberships.userId, userId),
    with: {
      workspace: true,
    },
  })

  return memberships.map(m => m.workspace)
}

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<DBWorkspaceMembership | undefined> {
  return await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.userId, userId),
      eq(workspaceMemberships.workspaceId, workspaceId)
    ),
  })
}

export async function deleteWorkspace(id: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Delete all memberships first
    await tx.delete(workspaceMemberships)
      .where(eq(workspaceMemberships.workspaceId, id))

    // Delete all channels
    await tx.delete(channels)
      .where(eq(channels.workspaceId, id))

    // Delete the workspace
    await tx.delete(workspaces)
      .where(eq(workspaces.id, id))
  })
}

export async function getWorkspaceUsers(workspaceId: string): Promise<WorkspaceUser[]> {
  const memberships = await db.query.workspaceMemberships.findMany({
    where: eq(workspaceMemberships.workspaceId, workspaceId),
    with: {
      user: true,
    },
    orderBy: [asc(workspaceMemberships.createdAt)],
  })

  return memberships.map(m => ({
    ...m.user,
    role: m.role,
  }))
}

export async function getWorkspaceChannels(workspaceId: string): Promise<DBChannel[]> {
  return await db.query.channels.findMany({
    where: eq(channels.workspaceId, workspaceId),
    orderBy: [asc(channels.name)],
  })
}

export async function findChannelBySlug(
  workspaceId: string,
  slug: string
): Promise<DBChannel | undefined> {
  return await db.query.channels.findFirst({
    where: and(
      eq(channels.workspaceId, workspaceId),
      eq(channels.slug, slug)
    ),
  })
}

export async function createChannel(params: CreateChannelParams): Promise<DBChannel> {
  const [channel] = await db.insert(channels).values({
    name: params.name,
    slug: generateSlug(params.name),
    workspaceId: params.workspaceId,
    type: params.type,
    createdAt: now(),
    updatedAt: now(),
  }).returning()

  return channel
}

export async function getDMChannels(workspaceId: string, userId: string): Promise<DMChannel[]> {
  type DMChannelWithMembers = DBDirectMessageChannel & {
    members: Array<{
      user: DBUser;
      unreadMessages: Array<{ userId: string }>;
    }>;
  };

  const channels = await db.query.directMessageChannels.findMany({
    where: eq(directMessageChannels.workspaceId, workspaceId),
    with: {
      members: {
        with: {
          user: true
        }
      }
    },
    orderBy: [desc(directMessageChannels.updatedAt)]
  });

  // Get unread counts separately
  const channelsWithUnread = await Promise.all(
    channels.map(async (channel) => {
      const unreadCounts = await db.query.unreadMessages.findMany({
        where: and(
          eq(unreadMessages.channelId, channel.id),
          eq(unreadMessages.userId, userId)
        ),
        columns: {
          userId: true
        }
      });

      return {
        ...channel,
        members: channel.members.map(member => ({
          ...member.user,
          unreadCount: unreadCounts.length
        }))
      };
    })
  );

  return channelsWithUnread;
}

export async function findDMChannelById(id: string): Promise<DBDirectMessageChannel | undefined> {
  return await db.query.directMessageChannels.findFirst({
    where: eq(directMessageChannels.id, id)
  })
}

export async function createDMChannel(params: CreateDMChannelParams): Promise<DBDirectMessageChannel> {
  return await db.transaction(async (tx) => {
    // Create the DM channel
    const [channel] = await tx.insert(directMessageChannels).values({
      workspaceId: params.workspaceId,
      createdAt: now(),
      updatedAt: now(),
    }).returning()

    // Add members to the channel
    await tx.insert(directMessageMembers).values(
      params.memberIds.map(userId => ({
        userId,
        channelId: channel.id,
        createdAt: now(),
        updatedAt: now(),
      }))
    )

    return channel
  })
}

export async function getDMChannelMembers(channelId: string): Promise<string[]> {
  const members = await db.query.directMessageMembers.findMany({
    where: eq(directMessageMembers.channelId, channelId),
    columns: {
      userId: true
    }
  })

  return members.map(m => m.userId)
}

export async function findExistingDMChannel(
  workspaceId: string,
  memberIds: string[]
): Promise<DBDirectMessageChannel | undefined> {
  // Get all DM channels in the workspace
  const channels = await db.query.directMessageChannels.findMany({
    where: eq(directMessageChannels.workspaceId, workspaceId),
    with: {
      members: {
        columns: {
          userId: true
        }
      }
    }
  })

  // Find a channel that has exactly these members
  return channels.find(channel => {
    const channelMemberIds = channel.members.map(m => m.userId)
    return (
      channelMemberIds.length === memberIds.length &&
      channelMemberIds.every(id => memberIds.includes(id))
    )
  })
} 