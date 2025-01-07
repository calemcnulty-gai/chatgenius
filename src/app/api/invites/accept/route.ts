import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships, users } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ 
        message: 'Unauthorized',
        status: 'error'
      }, { status: 401 })
    }

    const { workspaceId, email } = await req.json()
    if (!workspaceId || !email) {
      return NextResponse.json({ 
        message: 'Missing required fields',
        status: 'error'
      }, { status: 400 })
    }

    // Verify workspace exists
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    })

    if (!workspace) {
      return NextResponse.json({ 
        message: 'Workspace not found',
        status: 'error'
      }, { status: 404 })
    }

    // Wait for user to be created in our database (max 5 seconds)
    let user = null
    for (let i = 0; i < 10; i++) {
      user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      })
      if (user) break
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    if (!user) {
      return NextResponse.json({ 
        message: 'User not found in database. Please try again in a few seconds.',
        status: 'error'
      }, { status: 400 })
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

    return NextResponse.json({ 
      message: 'Successfully joined workspace',
      status: 'success'
    })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json({ 
      message: 'Failed to accept invitation',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 