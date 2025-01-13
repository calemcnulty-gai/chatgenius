import { db } from '@/db'
import { workspaces, workspaceMemberships, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs'
import { NextResponse } from 'next/server'
import { WorkspaceMembershipWithUser } from '@/types/db'

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

    // Get users in workspace
    const workspaceUsers = await db.query.workspaceMemberships.findMany({
      where: eq(workspaceMemberships.workspaceId, workspace.id),
      with: {
        user: true
      },
      orderBy: (memberships, { asc }) => [asc(memberships.createdAt)]
    }) as WorkspaceMembershipWithUser[]

    return NextResponse.json(workspaceUsers.map(m => m.user))
  } catch (error) {
    console.error('Error fetching workspace users:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 