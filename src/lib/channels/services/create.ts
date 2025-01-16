import { validateChannelName, generateChannelSlug, validateWorkspaceMembership } from '../validation'
import { createChannel } from '../queries'
import type { CreateChannelParams, Channel, ChannelValidationError } from '../types'

export async function createNewChannel({
  userId,
  name,
  workspaceId,
  type = 'public'
}: CreateChannelParams): Promise<{ channel: Channel | null; error?: ChannelValidationError }> {
  // Validate channel name
  const nameError = validateChannelName(name)
  if (nameError) {
    return {
      channel: null,
      error: {
        message: nameError,
        code: 'INVALID_INPUT'
      }
    }
  }

  // Verify user is a member of the workspace
  const membershipError = await validateWorkspaceMembership(userId, workspaceId)
  if (membershipError) {
    return { channel: null, error: membershipError }
  }

  // Generate slug from name
  const slug = generateChannelSlug(name)

  // Create channel
  const channel = await createChannel({
    workspaceId,
    name,
    slug,
    type,
  })

  return { channel }
} 