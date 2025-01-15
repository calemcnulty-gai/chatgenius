import { User } from '@clerk/nextjs/server'
import { findWorkspaceBySlug, getWorkspaceUsers, getWorkspaceMembership } from '../queries'
import type { WorkspaceUsersResponse } from '../types'

export async function listWorkspaceUsers(
  slug: string,
  clerkUser: User
): Promise<WorkspaceUsersResponse> {
  try {
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

    const membership = await getWorkspaceMembership(clerkUser.id, workspace.id)
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