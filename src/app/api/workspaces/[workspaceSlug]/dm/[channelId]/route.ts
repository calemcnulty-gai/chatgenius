import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { getDMChannel } from '@/lib/workspaces/services/dm'

export async function GET(
  request: Request,
  { params }: { params: { workspaceSlug: string; channelId: string } }
) {
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) {
    return NextResponse.json(
      { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  try {
    const result = await getDMChannel(
      params.workspaceSlug,
      params.channelId,
      userId
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