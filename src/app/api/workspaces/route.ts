import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { listWorkspaces, createNewWorkspace } from '@/lib/workspaces/services/workspace'

export async function GET() {
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

    const result = await listWorkspaces(clerkUser)
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ workspaces: result.workspaces })
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: { message: 'Failed to fetch workspaces', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
}

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

    const { name } = await req.json()
    if (!name) {
      return NextResponse.json(
        { error: { message: 'Missing workspace name', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const result = await createNewWorkspace(name, clerkUser)
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({ workspace: result.workspace })
  } catch (error) {
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: { message: 'Failed to create workspace', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 