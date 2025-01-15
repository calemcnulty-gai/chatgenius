import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import {
  listDMChannels,
  createOrGetDMChannel
} from '@/lib/workspaces/services/dm'

export async function GET(
  request: Request,
  { params }: { params: { workspaceSlug: string } }
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

    const result = await listDMChannels(params.workspaceSlug, clerkUser)
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
    console.error('Error listing DM channels:', error)
    return NextResponse.json(
      { error: { message: 'Failed to list DM channels', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { workspaceSlug: string } }
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

    const { memberIds } = await request.json()
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: { message: 'Member IDs are required', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const result = await createOrGetDMChannel(
      params.workspaceSlug,
      memberIds,
      clerkUser
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
    console.error('Error creating DM channel:', error)
    return NextResponse.json(
      { error: { message: 'Failed to create DM channel', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 