import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships, channels } from '@/db/schema'
import { and, eq, or } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('Fetching workspace:', { workspaceId: params.id, userId })

    // First check if workspace exists
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, params.id),
    })

    if (!workspace) {
      console.log('Workspace not found')
      return new NextResponse('Workspace not found', { status: 404 })
    }

    // Then check membership
    const membership = await db.query.workspaceMemberships.findFirst({
      where: and(
        eq(workspaceMemberships.workspaceId, params.id),
        eq(workspaceMemberships.userId, userId)
      ),
    })

    if (!membership) {
      console.log('User is not a member of workspace')
      return new NextResponse('Not a member', { status: 403 })
    }

    // Get or create default channel
    let channel = await db.query.channels.findFirst({
      where: and(
        eq(channels.workspaceId, params.id),
        eq(channels.name, 'general')
      ),
    })

    if (!channel) {
      console.log('Creating general channel')
      const channelId = uuidv4()
      await db.insert(channels).values({
        id: channelId,
        workspaceId: params.id,
        name: 'general',
        type: 'public',
      })
      
      channel = await db.query.channels.findFirst({
        where: eq(channels.id, channelId),
      })
    }

    console.log('Found workspace data:', {
      workspace,
      membership,
      channel,
    })

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      role: membership.role,
      defaultChannelId: channel!.id,
    })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 