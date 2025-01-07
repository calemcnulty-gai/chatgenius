import { db } from '@/db'
import { workspaces, channels, workspaceMemberships } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import WorkspaceLayout from '@/components/layout/WorkspaceLayout'
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar'
import { Message } from '@/components/chat/Message'

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

  // Fetch channels for sidebar
  const workspaceChannels = await db.query.channels.findMany({
    where: eq(channels.workspaceId, workspace.id),
    orderBy: (channels, { asc }) => [asc(channels.name)],
  })

  return (
    <WorkspaceLayout
      sidebarContent={
        <WorkspaceSidebar
          workspace={workspace}
          channels={workspaceChannels}
        />
      }
    >
      <div className="flex h-full flex-col bg-gray-900">
        {/* Channel header */}
        <div className="flex items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-3">
          <h1 className="text-lg font-medium text-white">#{channel.name}</h1>
        </div>

        {/* Messages area */}
        <Message channelId={channel.id} />
      </div>
    </WorkspaceLayout>
  )
} 