import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth/middleware'
import { listWorkspaceUsers } from '@/lib/workspaces/services/users'

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

    const result = await listWorkspaceUsers(params.workspaceSlug, userId)
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { 
          status: result.error.code === 'NOT_FOUND' ? 404 :
                 result.error.code === 'UNAUTHORIZED' ? 401 : 500 
        }
      )
    }

    return NextResponse.json({ users: result.users })
  } catch (error) {
    console.error('Error listing workspace users:', error)
    return NextResponse.json(
      { error: { message: 'Failed to list workspace users', code: 'INVALID_INPUT' } },
      { status: 500 }
    )
  }
} 