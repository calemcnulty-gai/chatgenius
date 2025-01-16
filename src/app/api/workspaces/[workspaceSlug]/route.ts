import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { getWorkspace, deleteWorkspace } from '@/lib/workspaces/services/workspace'

export async function GET(
  request: Request,
  { params }: { params: { workspaceSlug: string } }
) {
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) {
    return NextResponse.json(
      { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  try {
    const result = await getWorkspace(params.workspaceSlug, userId)
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
  const { userId, error: authError } = await getAuthenticatedUserId()
  if (authError || !userId) {
    return NextResponse.json(
      { error: authError || { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
      { status: 401 }
    )
  }

  try {
    const result = await deleteWorkspace(params.workspaceSlug, userId)
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