import {
  findWorkspaceBySlug,
  getWorkspaceMembership,
  getDMChannels,
  createDMChannel,
  findExistingDMChannel,
  findDMChannelById,
  getDMChannelMembers
} from '../queries'
import type { DMChannelsResponse, DMChannelResponse } from '../types'

export async function listDMChannels(
  slug: string,
  userId: string
): Promise<DMChannelsResponse> {
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

    const membership = await getWorkspaceMembership(userId, workspace.id)
    if (!membership) {
      return {
        channels: [],
        error: {
          message: 'Not authorized to access this workspace',
          code: 'UNAUTHORIZED'
        }
      }
    }

    const channels = await getDMChannels(workspace.id, userId)
    return { channels }
  } catch (error) {
    console.error('Error listing DM channels:', error)
    return {
      channels: [],
      error: {
        message: 'Failed to list DM channels',
        code: 'INVALID_INPUT'
      }
    }
  }
}

export async function createOrGetDMChannel(
  slug: string,
  memberIds: string[],
  userId: string
): Promise<DMChannelResponse> {
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

    const membership = await getWorkspaceMembership(userId, workspace.id)
    if (!membership) {
      return {
        channel: null,
        error: {
          message: 'Not authorized to access this workspace',
          code: 'UNAUTHORIZED'
        }
      }
    }

    // Ensure current user is included in members
    const allMemberIds = [...new Set([...memberIds, userId])]

    if (allMemberIds.length < 2) {
      return {
        channel: null,
        error: {
          message: 'DM channel must have at least 2 members',
          code: 'INVALID_INPUT'
        }
      }
    }

    // Check if channel already exists
    const existingChannel = await findExistingDMChannel(workspace.id, allMemberIds)
    if (existingChannel) {
      const channels = await getDMChannels(workspace.id, userId)
      const channel = channels.find(c => c.id === existingChannel.id)
      return { channel: channel || null }
    }

    // Create new channel
    const newChannel = await createDMChannel({
      workspaceId: workspace.id,
      memberIds: allMemberIds,
    })

    const channels = await getDMChannels(workspace.id, userId)
    const channel = channels.find(c => c.id === newChannel.id)
    return { channel: channel || null }
  } catch (error) {
    console.error('Error creating DM channel:', error)
    return {
      channel: null,
      error: {
        message: 'Failed to create DM channel',
        code: 'INVALID_INPUT'
      }
    }
  }
}

export async function getDMChannel(
  slug: string,
  channelId: string,
  userId: string
): Promise<DMChannelResponse> {
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

    const membership = await getWorkspaceMembership(userId, workspace.id)
    if (!membership) {
      return {
        channel: null,
        error: {
          message: 'Not authorized to access this workspace',
          code: 'UNAUTHORIZED'
        }
      }
    }

    // Get channel and verify it belongs to this workspace
    const channel = await findDMChannelById(channelId)
    if (!channel || channel.workspaceId !== workspace.id) {
      return {
        channel: null,
        error: {
          message: 'Channel not found',
          code: 'NOT_FOUND'
        }
      }
    }

    // Verify user is a member of this channel
    const memberIds = await getDMChannelMembers(channelId)
    if (!memberIds.includes(userId)) {
      return {
        channel: null,
        error: {
          message: 'Not authorized to access this channel',
          code: 'UNAUTHORIZED'
        }
      }
    }

    // Get full channel details including members and unread counts
    const channels = await getDMChannels(workspace.id, userId)
    const fullChannel = channels.find(c => c.id === channelId)
    
    return { channel: fullChannel || null }
  } catch (error) {
    console.error('Error getting DM channel:', error)
    return {
      channel: null,
      error: {
        message: 'Failed to get DM channel',
        code: 'INVALID_INPUT'
      }
    }
  }
} 