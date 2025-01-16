import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { sendInvite } from '@/lib/invites/services/invite'

export async function POST(req: Request) {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { email, workspaceId } = await req.json()
    if (!email || !workspaceId) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const inviteResult = await sendInvite({
      email,
      workspaceId,
      inviterId: userId,
    })

    if (inviteResult.error) {
      return NextResponse.json(
        { error: inviteResult.error },
        { status: inviteResult.error.code === 'UNAUTHORIZED' ? 401 : 400 }
      )
    }

    return NextResponse.json({ invite: inviteResult.invite })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: { message: 'Failed to create invite', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 