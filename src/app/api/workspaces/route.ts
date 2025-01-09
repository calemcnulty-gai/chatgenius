import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaces, workspaceMemberships } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getOrCreateUser } from '@/lib/db/users'

export async function GET() {
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

    // Get all workspaces the user is a member of
    const userWorkspaces = await db
      .select({
        workspace: workspaces,
      })
      .from(workspaceMemberships)
      .where(eq(workspaceMemberships.userId, user.id))
      .innerJoin(workspaces, eq(workspaceMemberships.workspaceId, workspaces.id))

    return NextResponse.json(userWorkspaces.map(m => m.workspace))
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

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

    const { name } = await req.json()
    if (!name) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Create workspace
    const [workspace] = await db
      .insert(workspaces)
      .values({
        id: uuidv4(),
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ownerId: user.id,
      })
      .returning()

    // Create workspace membership for creator
    await db.insert(workspaceMemberships).values({
      id: uuidv4(),
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    })

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Error creating workspace:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 