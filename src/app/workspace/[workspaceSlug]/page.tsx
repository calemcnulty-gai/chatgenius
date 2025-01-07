import { db } from '@/db'
import { workspaces, channels } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export default async function WorkspacePage({ params }: { params: { workspaceSlug: string } }) {
  // Get workspace by slug
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, params.workspaceSlug),
  })

  if (!workspace) {
    redirect('/')
  }

  // Find general channel
  const generalChannel = await db.query.channels.findFirst({
    where: and(
      eq(channels.workspaceId, workspace.id),
      eq(channels.slug, 'general')
    ),
  })

  if (generalChannel) {
    redirect(`/workspace/${params.workspaceSlug}/channel/general`)
  }

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-gray-500">Select a channel to start chatting</p>
    </div>
  )
} 