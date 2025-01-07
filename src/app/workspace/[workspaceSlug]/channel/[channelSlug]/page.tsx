import { db } from '@/db'
import { workspaces, channels, workspaceMemberships } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { MessageList } from '@/components/chat/MessageList'

export default async function ChannelPage({
  params,
}: {
  params: { workspaceSlug: string; channelSlug: string }
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

  // Verify membership
  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.workspaceId, workspace.id),
      eq(workspaceMemberships.userId, userId)
    ),
  })

  if (!membership) {
    redirect('/')
  }

  // Get channel by slug
  const channel = await db.query.channels.findFirst({
    where: and(
      eq(channels.workspaceId, workspace.id),
      eq(channels.slug, params.channelSlug)
    ),
  })

  if (!channel) {
    redirect(`/workspace/${params.workspaceSlug}`)
  }

  return (
    <div className="flex h-full flex-col bg-gray-800">
      {/* Channel header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-3">
        <h1 className="text-lg font-medium text-white">#{channel.name}</h1>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <MessageList channelId={channel.id} />
      </div>
    </div>
  )
} 