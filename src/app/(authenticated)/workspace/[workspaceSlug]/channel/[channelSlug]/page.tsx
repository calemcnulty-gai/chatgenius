import { db } from '@/db'
import { workspaces, channels, workspaceMemberships } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { auth, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { ChannelPageClient } from '@/components/channel/ChannelPageClient'
import { getOrCreateUser } from '@/lib/db/users'

export default async function ChannelPage({
  params,
}: {
  params: { workspaceSlug: string; channelSlug: string }
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
      eq(workspaceMemberships.userId, user.id)
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