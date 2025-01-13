import { db } from '@/db'
import { workspaces, directMessageChannels, directMessageMembers, users, unreadMessages } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import type { DirectMessageChannelWithUnreadCounts, DirectMessageChannelWithMembers, DirectMessageChannelWithUnreadMessages } from '@/types/db'

export async function GET(
  request: Request,
  { params }: { params: { workspaceSlug: string } }
) {
  const { userId } = auth()
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Get workspace
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, params.workspaceSlug),
    })

    if (!workspace) {
      return new NextResponse('Workspace not found', { status: 404 })
    }

    // Get user's internal ID
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get DM channels where user is a participant
    const dmChannels = await db.query.directMessageChannels.findMany({
      where: eq(directMessageChannels.workspaceId, workspace.id),
      with: {
        members: {
          with: {
            user: true
          }
        },
        unreadMessages: {
          where: eq(unreadMessages.userId, user.id)
        }
      },
      orderBy: (channels, { desc }) => [desc(channels.updatedAt)]
    }) as DirectMessageChannelWithUnreadMessages[]

    // Filter and transform channels
    const userDmChannels = dmChannels
      .filter(channel => 
        channel.members.some((member: { user: { id: string } }) => member.user.id === user.id)
      )
      .map(channel => {
        // Find the other user in the channel
        const otherMember = channel.members.find((member: { user: { id: string } }) => member.user.id !== user.id)
        const otherUser = otherMember?.user

        if (!otherUser) {
          return null // Skip channels without a valid other user
        }

        // Get unread count for this channel
        const unread = channel.unreadMessages?.[0]

        const transformed: DirectMessageChannelWithUnreadCounts = {
          id: channel.id,
          workspaceId: channel.workspaceId,
          createdAt: channel.createdAt,
          updatedAt: channel.updatedAt,
          otherUser: {
            id: otherUser.id,
            name: otherUser.name,
            profileImage: otherUser.profileImage,
            status: otherUser.status as 'active' | 'away' | 'offline'
          },
          unreadCount: unread?.unreadCount ?? 0,
          hasMention: unread?.hasMention ?? false
        }

        return transformed
      })
      .filter((channel): channel is DirectMessageChannelWithUnreadCounts => channel !== null)

    return NextResponse.json(userDmChannels)
  } catch (error) {
    console.error('Error fetching DM channels:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 