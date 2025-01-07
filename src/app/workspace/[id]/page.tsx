import { db } from '@/db'
import { workspaces, workspaceMemberships, channels } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import WorkspaceLayout from '@/components/layout/WorkspaceLayout'
import WorkspaceSidebar from '@/components/workspace/WorkspaceSidebar'

export default async function WorkspacePage({ params }: { params: { id: string } }) {
  const { userId } = auth()
  if (!userId) {
    redirect('/sign-in')
  }

  // Get workspace and verify membership
  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.workspaceId, params.id),
      eq(workspaceMemberships.userId, userId)
    ),
    with: {
      workspace: true,
    },
  })

  if (!membership) {
    redirect('/')
  }

  // Fetch channels
  const workspaceChannels = await db.query.channels.findMany({
    where: eq(channels.workspaceId, params.id),
    orderBy: (channels, { asc }) => [asc(channels.name)],
  })

  return (
    <WorkspaceLayout
      sidebarContent={
        <WorkspaceSidebar
          workspace={membership.workspace}
          channels={workspaceChannels}
        />
      }
    >
      {/* Main content */}
    </WorkspaceLayout>
  )
} 