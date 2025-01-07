import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships, channels } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { workspaceSlug: string; id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get workspace by slug
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, params.workspaceSlug),
    })

    if (!workspace) {
      return new NextResponse('Workspace not found', { status: 404 })
    }

    // Verify membership
    const membership = await db.query.workspaceMemberships.findFirst({
      where: and(
        eq(workspaceMemberships.workspaceId, workspace.id),
        eq(workspaceMemberships.userId, userId)
      ),
    })

    if (!membership) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get default channel (general)
    const channel = await db.query.channels.findFirst({
      where: and(
        eq(channels.workspaceId, workspace.id),
        eq(channels.slug, 'general')
      ),
    })

    if (!channel) {
      return new NextResponse('Default channel not found', { status: 404 })
    }

    // Return workspace details
    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: membership.role,
      defaultChannelId: channel.id,
    })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 