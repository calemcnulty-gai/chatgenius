import { db } from '@/db'
import { workspaceMemberships } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import type { ChannelValidationError } from './types'

export function validateChannelName(name: string): string | null {
  if (!name) {
    return 'Channel name is required'
  }
  if (name.length < 2) {
    return 'Channel name must be at least 2 characters long'
  }
  if (name.length > 30) {
    return 'Channel name must be less than 30 characters long'
  }
  if (!/^[a-z0-9-_]+$/.test(name.toLowerCase())) {
    return 'Channel name can only contain letters, numbers, hyphens, and underscores'
  }
  return null
}

export function generateChannelSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-')
}

export async function validateWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<ChannelValidationError | null> {
  const membership = await db.query.workspaceMemberships.findFirst({
    where: and(
      eq(workspaceMemberships.workspaceId, workspaceId),
      eq(workspaceMemberships.userId, userId)
    ),
  })

  if (!membership) {
    return {
      message: 'User is not a member of this workspace',
      code: 'UNAUTHORIZED'
    }
  }

  return null
} 