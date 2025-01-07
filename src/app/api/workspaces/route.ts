import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships, channels } from '@/db/schema'
import { v4 as uuidv4 } from 'uuid'
import { eq } from 'drizzle-orm'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { name } = await req.json()
    if (!name) {
      return new NextResponse('Name is required', { status: 400 })
    }

    // Create workspace
    const slug = generateSlug(name)
    const [workspace] = await db.insert(workspaces).values({
      id: uuidv4(),
      name,
      slug,
    }).returning()

    // Create workspace membership
    await db.insert(workspaceMemberships).values({
      id: uuidv4(),
      workspaceId: workspace.id,
      userId,
      role: 'admin',
    })

    // Create default channel
    await db.insert(channels).values({
      id: uuidv4(),
      workspaceId: workspace.id,
      name: 'general',
      slug: 'general',
      type: 'public',
    })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error creating workspace:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const memberships = await db
      .select({
        workspace: workspaces,
        role: workspaceMemberships.role,
      })
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.userId, userId))
      .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))

    return NextResponse.json(
      memberships.map(({ workspace, role }) => ({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role,
      }))
    )
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 