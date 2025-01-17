import { db } from '@/db'
import { workspaces, directMessageChannels, directMessageMembers, users, unreadMessages } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { MessageList } from '@/components/chat/MessageList'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { now } from '@/types/timestamp'
import type { User } from '@/types/user'

type DMChannel = typeof directMessageChannels.$inferSelect & {
  members: (typeof directMessageMembers.$inferSelect & {
    user: typeof users.$inferSelect
  })[]
}

export default async function DMChannelPage({
  params,
}: {
  params: { workspaceSlug: string; channelId: string }
}) {
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) {
    redirect('/sign-in')
  }

  // Get workspace
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, params.workspaceSlug),
  })

  if (!workspace) {
    redirect('/workspace')
  }

  // Get DM channel
  const channel = await db.query.directMessageChannels.findFirst({
    where: eq(directMessageChannels.id, params.channelId),
    with: {
      members: {
        with: {
          user: true,
        },
      },
    },
  }) as DMChannel | null

  if (!channel) {
    redirect(`/workspace/${params.workspaceSlug}`)
  }

  // Clear unread messages for this channel
  await db
    .update(unreadMessages)
    .set({
      unreadCount: 0,
      hasMention: false,
      updatedAt: now(),
    })
    .where(
      and(
        eq(unreadMessages.userId, userId),
        eq(unreadMessages.dmChannelId, params.channelId)
      )
    )

  // Find the other member
  const otherMember = channel.members.find(member => member.userId !== userId)
  if (!otherMember) {
    redirect(`/workspace/${params.workspaceSlug}`)
  }

  const otherUser: User = {
    id: otherMember.user.id,
    name: otherMember.user.name,
    email: otherMember.user.email,
    profileImage: otherMember.user.profileImage,
    displayName: otherMember.user.displayName,
    title: otherMember.user.title,
    timeZone: otherMember.user.timeZone,
    status: otherMember.user.status as 'active' | 'away' | 'offline',
    isAi: otherMember.user.isAi ?? false,
    lastHeartbeat: otherMember.user.lastHeartbeat,
    createdAt: otherMember.user.createdAt,
    updatedAt: otherMember.user.updatedAt,
  }

  return (
    <div className="flex h-full flex-col bg-gray-800">
      {/* Channel header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-3">
        <UserAvatar
          user={otherUser}
          size="sm"
        />
        <h1 className="text-lg font-medium text-white">
          {otherMember.user.displayName || otherMember.user.name}
        </h1>
      </div>

      {/* Messages area */}
      <div className="flex-1">
        <MessageList channelId={channel.id} variant="dm" />
      </div>
    </div>
  )
} 