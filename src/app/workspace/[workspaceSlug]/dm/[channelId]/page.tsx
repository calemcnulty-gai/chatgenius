import { db } from '@/db'
import { workspaces, directMessageChannels, directMessageMembers } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { MessageList } from '@/components/chat/MessageList'
import { UserAvatar } from '@/components/ui/UserAvatar'

export default async function DMChannelPage({
  params,
}: {
  params: { workspaceSlug: string; channelId: string }
}) {
  const { userId } = auth()
  if (!userId) {
    redirect('/sign-in')
  }

  // Get workspace by slug
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, params.workspaceSlug),
  })

  if (!workspace) {
    redirect('/')
  }

  // Get DM channel and verify membership
  const channel = await db.query.directMessageChannels.findFirst({
    where: eq(directMessageChannels.id, params.channelId),
    with: {
      members: {
        with: {
          user: true
        }
      }
    }
  })

  if (!channel) {
    redirect(`/workspace/${params.workspaceSlug}`)
  }

  // Verify user is a member of the channel
  const isMember = channel.members.some(member => member.userId === userId)
  if (!isMember) {
    redirect(`/workspace/${params.workspaceSlug}`)
  }

  // Get the other user in the DM
  const otherUser = channel.members.find(member => member.userId !== userId)?.user
  if (!otherUser) {
    redirect(`/workspace/${params.workspaceSlug}`)
  }

  return (
    <div className="flex h-screen flex-col bg-gray-800">
      {/* Channel header */}
      <div className="flex items-center gap-3 border-b border-gray-700 bg-gray-800 px-4 py-3">
        <UserAvatar
          name={otherUser.name}
          image={otherUser.profileImage}
          className="h-6 w-6"
        />
        <h1 className="text-lg font-medium text-white">{otherUser.name}</h1>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageList channelId={channel.id} />
      </div>
    </div>
  )
} 