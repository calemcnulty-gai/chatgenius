import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '..'
import { workspaces, channels } from '../schema'
import { eq, and } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils'

export async function addGeneralChannels() {
  // Get all workspaces
  const existingWorkspaces = await db.select().from(workspaces)

  // For each workspace, check if it has a general channel
  for (const workspace of existingWorkspaces) {
    const existingChannel = await db.query.channels.findFirst({
      where: and(
        eq(channels.workspaceId, workspace.id),
        eq(channels.name, 'general')
      ),
    })

    if (!existingChannel) {
      // Create general channel if it doesn't exist
      await db.insert(channels).values({
        id: uuidv4(),
        workspaceId: workspace.id,
        name: 'general',
        slug: 'general',
        type: 'public',
      })
    }
  }
} 