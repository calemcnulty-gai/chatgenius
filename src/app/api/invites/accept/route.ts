import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { workspaceId, email } = await req.json()
    if (!workspaceId || !email) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Verify workspace exists
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    })

    if (!workspace) {
      return new NextResponse('Workspace not found', { status: 404 })
    }

    // Check if user is already a member
    const existingMembership = await db.query.workspaceMemberships.findFirst({
      where: and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.userId, userId)
      ),
    })

    if (existingMembership) {
      return NextResponse.json({ 
        message: 'Already a member of this workspace',
        status: 'error'
      }, { status: 400 })
    }

    // Create workspace membership
    await db.insert(workspaceMemberships).values({
      id: uuidv4(),
      workspaceId,
      userId,
      role: 'member',
    })

    return NextResponse.json({ message: 'Successfully joined workspace' })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 