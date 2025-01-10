import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaceMemberships, channels } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
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

    const { name, workspaceId } = await req.json()
    if (!name || !workspaceId) {
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

    // Create channel
    const [channel] = await db
      .insert(channels)
      .values({
        workspaceId,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        type: 'public',
      })
      .returning()

    return NextResponse.json(channel)
  } catch (error) {
    console.error('Error creating channel:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 