import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { getOrCreateUser } from '@/lib/db/users'
import { sendInvite } from '@/lib/invites/services/invite'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json(
      { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: { message: 'User not found', code: 'NOT_FOUND' } },
        { status: 404 }
      )
    }

    // Get or create user to get their database ID
    const user = await getOrCreateUser({
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      emailAddresses: clerkUser.emailAddresses,
      imageUrl: clerkUser.imageUrl,
    })

    const { email, workspaceId } = await req.json()
    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const result = await sendInvite({
      email,
      workspaceId,
      inviterId: user.id,
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error.code === 'UNAUTHORIZED' ? 401 : 400 }
      )
    }

    return NextResponse.json({ invite: result.invite })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: { message: 'Failed to create invite', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 