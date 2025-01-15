import { User } from '@clerk/nextjs/server'
import {
  findWorkspaceBySlug,
  getWorkspaceChannels,
  getWorkspaceMembership,
  createChannel,
  findChannelBySlug
} from '../queries'
import type {
  ChannelResponse,
  ChannelsResponse,
  CreateChannelParams
} from '../types'

export async function listWorkspaceChannels(
  slug: string,
  clerkUser: User
): Promise<ChannelsResponse> {
  try {
    const workspace = await findWorkspaceBySlug(slug)
    if (!workspace) {
      return {
        channels: [],
        error: {
          message: 'Workspace not found',
          code: 'NOT_FOUND'
        }
      }
    }

    const membership = await getWorkspaceMembership(clerkUser.id, workspace.id)
    if (!membership) {
      return {
        channels: [],
        error: {
          message: 'Not authorized to access this workspace',
          code: 'UNAUTHORIZED'
        }
      }
    }

    const channels = await getWorkspaceChannels(workspace.id)
    return { channels }
  } catch (error) {
    console.error('Error listing workspace channels:', error)
    return {
      channels: [],
      error: {
        message: 'Failed to list workspace channels',
        code: 'INVALID_INPUT'
      }
    }
  }
}

export async function createWorkspaceChannel(
  slug: string,
  name: string,
  type: 'public' | 'private',
  clerkUser: User
): Promise<ChannelResponse> {
  try {
    const workspace = await findWorkspaceBySlug(slug)
    if (!workspace) {
      return {
        channel: null,
        error: {
          message: 'Workspace not found',
          code: 'NOT_FOUND'
        }
      }
    }

    const membership = await getWorkspaceMembership(clerkUser.id, workspace.id)
    if (!membership) {
      return {
        channel: null,
        error: {
          message: 'Not authorized to access this workspace',
          code: 'UNAUTHORIZED'
        }
      }
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return {
        channel: null,
        error: {
          message: 'Only workspace owners and admins can create channels',
          code: 'UNAUTHORIZED'
        }
      }
    }

    if (!name || name.length < 2 || name.length > 50) {
      return {
        channel: null,
        error: {
          message: 'Channel name must be between 2 and 50 characters',
          code: 'INVALID_INPUT'
        }
      }
    }

    // Check if channel with same name exists
    const existingChannel = await findChannelBySlug(workspace.id, name.toLowerCase())
    if (existingChannel) {
      return {
        channel: null,
        error: {
          message: 'Channel with this name already exists',
          code: 'INVALID_INPUT'
        }
      }
    }

    const channel = await createChannel({
      name,
      workspaceId: workspace.id,
      type,
    })

    return { channel }
  } catch (error) {
    console.error('Error creating workspace channel:', error)
    return {
      channel: null,
      error: {
        message: 'Failed to create workspace channel',
        code: 'INVALID_INPUT'
      }
    }
  }
} 