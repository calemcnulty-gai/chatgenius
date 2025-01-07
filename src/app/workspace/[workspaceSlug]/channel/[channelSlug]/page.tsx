import { db } from '@/db'
import { workspaces, channels, workspaceMemberships } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { ChannelPageClient } from '@/components/channel/ChannelPageClient'

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

  return <ChannelPageClient channel={channel} />
} 