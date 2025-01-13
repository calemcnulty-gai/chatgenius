import { db } from '@/db'
import { workspaces, directMessageChannels, directMessageMembers, users, unreadMessages } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { MessageList } from '@/components/chat/MessageList'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { getOrCreateUser } from '@/lib/db/users'
import { now } from '@/types/timestamp'

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
  const user = await getOrCreateUser({
    id: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    emailAddresses: clerkUser.emailAddresses,
    imageUrl: clerkUser.imageUrl,
  })

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
        eq(unreadMessages.userId, user.id),
        eq(unreadMessages.dmChannelId, params.channelId)
      )
    )

  // Find the other member
  const otherMember = channel.members.find(member => member.userId !== user.id)
  if (!otherMember) {
    redirect(`/workspace/${params.workspaceSlug}`)
  }

  const otherUser = {
    id: otherMember.user.id,
    name: otherMember.user.name,
    email: otherMember.user.email,
    profileImage: otherMember.user.profileImage,
    displayName: otherMember.user.displayName,
    title: otherMember.user.title,
    timeZone: otherMember.user.timeZone,
    status: otherMember.user.status,
    createdAt: otherMember.user.createdAt,
    updatedAt: otherMember.user.updatedAt,
  }

  return (
    <div className="flex h-full flex-col bg-gray-800">
      {/* Channel header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-3">
        <UserAvatar
          user={{
            id: otherMember.user.id,
            clerkId: otherMember.user.clerkId,
            name: otherMember.user.name,
            email: otherMember.user.email,
            profileImage: otherMember.user.profileImage,
            displayName: otherMember.user.displayName,
            title: otherMember.user.title,
            timeZone: otherMember.user.timeZone,
            status: otherMember.user.status as 'active' | 'away' | 'offline' || 'offline',
            lastHeartbeat: otherMember.user.lastHeartbeat,
            createdAt: otherMember.user.createdAt,
            updatedAt: otherMember.user.updatedAt,
          }}
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