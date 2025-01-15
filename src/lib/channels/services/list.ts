import { validateAndGetUser, validateWorkspaceMembership } from '../validation'
import { getChannelsByWorkspaceId } from '../queries'
import type { GetChannelsParams, Channel, ChannelValidationError } from '../types'

export async function listChannels({
  workspaceId,
  clerkUser
}: GetChannelsParams): Promise<{ channels: Channel[] | null; error?: ChannelValidationError }> {
  // Get or create user to get their database ID
  const user = await validateAndGetUser(clerkUser)

  // Verify user is a member of the workspace
  const membershipError = await validateWorkspaceMembership(user.id, workspaceId)
  if (membershipError) {
    return { channels: null, error: membershipError }
  }

  // Get all channels in the workspace
  const channels = await getChannelsByWorkspaceId(workspaceId)

  return { channels }
} 