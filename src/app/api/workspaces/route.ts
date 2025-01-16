import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { listWorkspaces, createNewWorkspace } from '@/lib/workspaces/services/workspace'

export async function GET() {
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const result = await listWorkspaces(userId)
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
  try {
    const { userId, error: authError } = await getAuthenticatedUserId()
    if (authError || !userId) {
      return NextResponse.json(
        { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    }

    const { name } = await req.json()
    if (!name) {
      return NextResponse.json(
        { error: { message: 'Missing workspace name', code: 'INVALID_INPUT' } },
        { status: 400 }
      )
    }

    const result = await createNewWorkspace(name, userId)
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