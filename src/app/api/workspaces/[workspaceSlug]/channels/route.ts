import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import {
  listWorkspaceChannels,
  createWorkspaceChannel
} from '@/lib/workspaces/services/channels'

export async function GET(
  request: Request,
  { params }: { params: { workspaceSlug: string } }
) {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const result = await listWorkspaceChannels(params.workspaceSlug, userId)
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { 
          status: result.error.code === 'NOT_FOUND' ? 404 :
                 result.error.code === 'UNAUTHORIZED' ? 401 : 500 
        }
      )
    }

    return NextResponse.json({ channels: result.channels })
  } catch (error) {
    console.error('Error listing workspace channels:', error)
    return NextResponse.json(
      { error: { message: 'Failed to list workspace channels', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { workspaceSlug: string } }
) {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { name, type = 'public' } = await request.json()
    if (!name) {
      return NextResponse.json(
        { error: { message: 'Channel name is required', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const result = await createWorkspaceChannel(
      params.workspaceSlug,
      name,
      type,
      userId
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { 
          status: result.error.code === 'NOT_FOUND' ? 404 :
                 result.error.code === 'UNAUTHORIZED' ? 401 : 400 
        }
      )
    }

    return NextResponse.json({ channel: result.channel })
  } catch (error) {
    console.error('Error creating workspace channel:', error)
    return NextResponse.json(
      { error: { message: 'Failed to create workspace channel', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 