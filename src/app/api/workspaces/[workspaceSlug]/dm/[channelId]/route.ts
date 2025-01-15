import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { getDMChannel } from '@/lib/workspaces/services/dm'

export async function GET(
  request: Request,
  { params }: { params: { workspaceSlug: string; channelId: string } }
) {
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

    const result = await getDMChannel(
      params.workspaceSlug,
      params.channelId,
      clerkUser
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { 
          status: result.error.code === 'NOT_FOUND' ? 404 :
                 result.error.code === 'UNAUTHORIZED' ? 401 : 500 
        }
      )
    }

    return NextResponse.json({ channel: result.channel })
  } catch (error) {
    console.error('Error getting DM channel:', error)
    return NextResponse.json(
      { error: { message: 'Failed to get DM channel', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 