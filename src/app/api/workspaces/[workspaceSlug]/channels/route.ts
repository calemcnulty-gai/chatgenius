import { db } from '@/db'
import { channels, workspaces } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { workspaceSlug: string } }
) {
  const { userId } = auth()
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // Get workspace
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.slug, params.workspaceSlug),
    })

    if (!workspace) {
      return new NextResponse('Workspace not found', { status: 404 })
    }

    // Get channels for workspace
    const workspaceChannels = await db.query.channels.findMany({
      where: eq(channels.workspaceId, workspace.id),
      orderBy: (channels, { asc }) => [asc(channels.name)]
    })

    return NextResponse.json(workspaceChannels)
  } catch (error) {
    console.error('Error fetching channels:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 