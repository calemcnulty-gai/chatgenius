import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { createNewChannel } from '@/lib/channels/services/create'
import { listChannels } from '@/lib/channels/services/list'

export async function GET(req: Request) {
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

    // Get workspaceId from query params
    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return new NextResponse('Missing workspace ID', { status: 400 })
    }

    const { channels, error } = await listChannels({ workspaceId, clerkUser })
    
    if (error) {
      return new NextResponse(error.message, { 
        status: error.code === 'UNAUTHORIZED' ? 401 : 400 
      })
    }

    return NextResponse.json(channels)
  } catch (error) {
    console.error('Error fetching channels:', error)
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

    const { name, workspaceId, type } = await req.json()
    if (!name || !workspaceId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const { channel, error } = await createNewChannel({ 
      name, 
      workspaceId, 
      type, 
      clerkUser 
    })
    
    if (error) {
      return new NextResponse(error.message, { 
        status: error.code === 'UNAUTHORIZED' ? 401 : 400 
      })
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error('Error creating channel:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 