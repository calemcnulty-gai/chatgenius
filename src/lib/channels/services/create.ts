import { validateAndGetUser, validateChannelName, generateChannelSlug, validateWorkspaceMembership } from '../validation'
import { createChannel } from '../queries'
import type { CreateChannelParams, Channel, ChannelValidationError } from '../types'

export async function createNewChannel({
  name,
  workspaceId,
  type = 'public',
  clerkUser
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

  // Get or create user to get their database ID
  const user = await validateAndGetUser(clerkUser)

  // Verify user is a member of the workspace
  const membershipError = await validateWorkspaceMembership(user.id, workspaceId)
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