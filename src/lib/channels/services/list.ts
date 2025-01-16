import { validateWorkspaceMembership } from '../validation'
import { getChannelsByWorkspaceId } from '../queries'
import type { GetChannelsParams, Channel, ChannelValidationError } from '../types'

export async function listChannels({
  userId,
  workspaceId
}: GetChannelsParams): Promise<{ channels: Channel[] | null; error?: ChannelValidationError }> {
  // Verify user is a member of the workspace
  const membershipError = await validateWorkspaceMembership(userId, workspaceId)
  if (membershipError) {
    return { channels: null, error: membershipError }
  }

  // Get all channels in the workspace
  const channels = await getChannelsByWorkspaceId(workspaceId)

  return { channels }
} 