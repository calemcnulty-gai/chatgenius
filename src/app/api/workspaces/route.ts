import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships, channels } from '@/db/schema'
import { v4 as uuidv4 } from 'uuid'
import { eq } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { name, description } = await req.json()
    const workspaceId = uuidv4()
    
    console.log('Creating workspace:', { workspaceId, userId, name, description })

    // Create workspace
    const slug = generateSlug(name)
    await db.insert(workspaces).values({
      id: workspaceId,
      name,
      slug,
      description,
      ownerId: userId,
    })
    console.log('Workspace created')

    // Create default general channel
    const channelId = uuidv4()
    await db.insert(channels).values({
      id: channelId,
      workspaceId,
      name: 'general',
      type: 'public',
    })
    console.log('Channel created')

    // Add creator as admin member
    const membershipId = uuidv4()
    await db.insert(workspaceMemberships).values({
      id: membershipId,
      workspaceId,
      userId,
      role: 'admin',
    })
    console.log('Membership created:', { membershipId, workspaceId, userId })

    return NextResponse.json({ 
      id: workspaceId,
      defaultChannelId: channelId 
    })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 })
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
        description: workspace.description,
        role,
      }))
    )
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 