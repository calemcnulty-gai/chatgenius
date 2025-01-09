import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { getOrCreateUser } from '@/lib/db/users'

export async function DELETE(
  request: Request,
  { params }: { params: { workspaceSlug: string; id: string } }
) {
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

    // Verify user is a member of the workspace
    const membership = await db.query.workspaceMemberships.findFirst({
      where: and(
        eq(workspaceMemberships.workspaceId, params.id),
        eq(workspaceMemberships.userId, user.id)
      ),
    })

    if (!membership || membership.role !== 'owner') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Delete workspace
    await db.delete(workspaces).where(eq(workspaces.id, params.id))

    return new NextResponse('OK')
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 