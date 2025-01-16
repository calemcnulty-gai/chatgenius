import {
  createWorkspace,
  getUserWorkspaces,
  findWorkspaceBySlug,
  getWorkspaceMembership,
  deleteWorkspace as deleteWorkspaceQuery
} from '../queries'
import type {
  WorkspaceResponse,
  WorkspacesResponse,
  WorkspaceMembershipResponse
} from '../types'

export async function listWorkspaces(userId: string): Promise<WorkspacesResponse> {
  try {
    const workspaces = await getUserWorkspaces(userId)
    return { workspaces }
  } catch (error) {
    console.error('Error listing workspaces:', error)
    return {
      workspaces: [],
      error: {
        message: 'Failed to list workspaces',
        code: 'INVALID_INPUT'
      }
    }
  }
}

export async function createNewWorkspace(
  name: string,
  userId: string
): Promise<WorkspaceResponse> {
  try {
    if (!name || name.length < 3 || name.length > 50) {
      return {
        workspace: null,
        error: {
          message: 'Workspace name must be between 3 and 50 characters',
          code: 'INVALID_INPUT'
        }
      }
    }

    const workspace = await createWorkspace({
      name,
      userId,
    })

    return { workspace }
  } catch (error) {
    console.error('Error creating workspace:', error)
    return {
      workspace: null,
      error: {
        message: 'Failed to create workspace',
        code: 'INVALID_INPUT'
      }
    }
  }
}

export async function getWorkspace(
  slug: string,
  userId: string
): Promise<WorkspaceMembershipResponse> {
  try {
    const workspace = await findWorkspaceBySlug(slug)
    if (!workspace) {
      return {
        workspace: null,
        membership: null,
        error: {
          message: 'Workspace not found',
          code: 'NOT_FOUND'
        }
      }
    }

    const membership = await getWorkspaceMembership(userId, workspace.id)
    if (!membership) {
      return {
        workspace: null,
        membership: null,
        error: {
          message: 'Not authorized to access this workspace',
          code: 'UNAUTHORIZED'
        }
      }
    }

    return { workspace, membership }
  } catch (error) {
    console.error('Error getting workspace:', error)
    return {
      workspace: null,
      membership: null,
      error: {
        message: 'Failed to get workspace',
        code: 'INVALID_INPUT'
      }
    }
  }
}

export async function deleteWorkspace(
  slug: string,
  userId: string
): Promise<WorkspaceResponse> {
  try {
    const workspace = await findWorkspaceBySlug(slug)
    if (!workspace) {
      return {
        workspace: null,
        error: {
          message: 'Workspace not found',
          code: 'NOT_FOUND'
        }
      }
    }

    const membership = await getWorkspaceMembership(userId, workspace.id)
    if (!membership || membership.role !== 'owner') {
      return {
        workspace: null,
        error: {
          message: 'Not authorized to delete this workspace',
          code: 'UNAUTHORIZED'
        }
      }
    }

    await deleteWorkspaceQuery(workspace.id)
    return { workspace }
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return {
      workspace: null,
      error: {
        message: 'Failed to delete workspace',
        code: 'INVALID_INPUT'
      }
    }
  }
} 