import { db } from '@/db'
import { eq, and } from 'drizzle-orm'
import { directMessageChannels, directMessageMembers, users, unreadMessages } from '@/db/schema'
import { DirectMessageChannelWithMembers } from '@/types/db'
import { auth } from '@clerk/nextjs'

export async function getChannel(channelId: string): Promise<DirectMessageChannelWithMembers | null> {
  const { userId } = auth()
  if (!userId) return null

  // Get the channel and its members
  const [channel] = await db
    .select({
      id: directMessageChannels.id,
      workspaceId: directMessageChannels.workspaceId,
      createdAt: directMessageChannels.createdAt,
      updatedAt: directMessageChannels.updatedAt,
    })
    .from(directMessageChannels)
    .where(eq(directMessageChannels.id, channelId))
    .limit(1)

  if (!channel) return null

  // Get the channel members with user details and unread counts
  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      profileImage: users.profileImage,
      status: users.status,
    })
    .from(directMessageMembers)
    .innerJoin(users, eq(users.id, directMessageMembers.userId))
    .where(eq(directMessageMembers.channelId, channelId))

  // Get unread counts in a separate query
  const unreadCounts = await db
    .select({
      userId: unreadMessages.userId,
      count: unreadMessages.unreadCount,
    })
    .from(unreadMessages)
    .where(
      and(
        eq(unreadMessages.dmChannelId, channelId),
        eq(unreadMessages.userId, userId)
      )
    )

  // Verify the current user is a member
  if (!members.some(member => member.id === userId)) {
    return null
  }

  // Convert status to the correct type and add unread counts
  const typedMembers = members.map(member => ({
    ...member,
    status: (member.status as 'active' | 'away' | 'offline' | null) || 'offline',
    unreadCount: unreadCounts.find(uc => uc.userId === member.id)?.count || 0
  }))

  return {
    ...channel,
    members: typedMembers,
  }
} 