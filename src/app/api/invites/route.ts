import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { pusherServer } from '@/lib/pusher'
import { PusherEvent } from '@/types/events'
import { getOrCreateUser } from '@/lib/db/users'

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = auth()
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get the full user data from Clerk
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get or create user to get their database ID
    const user = await getOrCreateUser({
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses,
      imageUrl: clerkUser.imageUrl,
    })

    const { workspaceId, email } = await req.json()
    if (!workspaceId || !email) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Verify user is a member of the workspace
    const membership = await db.query.workspaceMemberships.findFirst({
      where: and(
        eq(workspaceMemberships.workspaceId, workspaceId),
        eq(workspaceMemberships.userId, user.id)
      ),
    })

    if (!membership) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get workspace details
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    })

    if (!workspace) {
      return new NextResponse('Workspace not found', { status: 404 })
    }

    // Create invite token
    const inviteToken = uuidv4()

    // TODO: Send invite email with the token

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating invite:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 