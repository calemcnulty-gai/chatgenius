import { NextResponse } from 'next/server'
import { createNewChannel } from '@/lib/channels/services/create'
import { listChannels } from '@/lib/channels/services/list'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'

export async function GET(req: Request) {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    // Get workspaceId from query params
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json(
        { error: { message: 'Missing workspace ID', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const { channels, error } = await listChannels({ userId, workspaceId })
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 400 }
      )
    }

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    const { name, workspaceId, type } = await req.json()
    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: { message: 'Missing required fields', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const { channel, error } = await createNewChannel({ 
      userId,
      name, 
      workspaceId, 
      type
    })
    
    if (error) {
      return NextResponse.json(
        { error },
        { status: error.code === 'UNAUTHORIZED' ? 401 : 400 }
      )
    }

    return NextResponse.json({ channel })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json(
      { error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    )
  }
} 