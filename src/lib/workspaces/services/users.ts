import { findWorkspaceBySlug, getWorkspaceUsers, getWorkspaceMembership } from '../queries'
import { validateAndGetUser } from '../validation'
import type { WorkspaceUsersResponse } from '../types'
import type { DBUser } from '@/lib/auth/types'

export async function listWorkspaceUsers(
  slug: string,
  userId: string
): Promise<WorkspaceUsersResponse> {
  try {
    const user = validateAndGetUser(userId)
    const workspace = await findWorkspaceBySlug(slug)
    if (!workspace) {
      return {
        users: [],
        error: {
          message: 'Workspace not found',
          code: 'NOT_FOUND'
        }
      }
    }

    const membership = await getWorkspaceMembership(user.id, workspace.id)
    if (!membership) {
      return {
        users: [],
        error: {
          message: 'Not authorized to access this workspace',
          code: 'UNAUTHORIZED'
        }
      }
    }

    const users = await getWorkspaceUsers(workspace.id)
    return { users }
  } catch (error) {
    console.error('Error listing workspace users:', error)
    return {
      users: [],
      error: {
        message: 'Failed to list workspace users',
        code: 'INVALID_INPUT'
      }
    }
  }
} 