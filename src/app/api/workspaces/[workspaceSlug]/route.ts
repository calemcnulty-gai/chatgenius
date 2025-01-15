import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs'
import { getWorkspace, deleteWorkspace } from '@/lib/workspaces/services/workspace'

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

    const result = await getWorkspace(params.workspaceSlug, clerkUser)
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { 
          status: result.error.code === 'NOT_FOUND' ? 404 :
                 result.error.code === 'UNAUTHORIZED' ? 401 : 500 
        }
      )
    }

    return NextResponse.json({ workspace: result.workspace })
  } catch (error) {
    console.error('Error getting workspace:', error)
    return NextResponse.json(
      { error: { message: 'Failed to get workspace', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const result = await deleteWorkspace(params.workspaceSlug, clerkUser)
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { 
          status: result.error.code === 'NOT_FOUND' ? 404 :
                 result.error.code === 'UNAUTHORIZED' ? 401 : 500 
        }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return NextResponse.json(
      { error: { message: 'Failed to delete workspace', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 