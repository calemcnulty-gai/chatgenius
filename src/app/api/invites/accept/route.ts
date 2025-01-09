import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { db } from '@/db'
import { workspaceMemberships } from '@/db/schema'
import { v4 as uuidv4 } from 'uuid'
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

    const { workspaceId } = await req.json()
    if (!workspaceId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Create workspace membership
    await db.insert(workspaceMemberships).values({
      id: uuidv4(),
      workspaceId,
      userId: user.id,
      role: 'member',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 