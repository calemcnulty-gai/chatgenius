import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '..'
import { workspaces, channels } from '../schema'
import { eq, and } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils'

async function generateUniqueSlug(name: string, table: 'workspaces' | 'channels', workspaceId?: string) {
  let baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    // Check if slug exists
    const exists = table === 'workspaces' 
      ? await db.select().from(workspaces).where(eq(workspaces.slug, slug))
      : await db.select().from(channels).where(
          and(
            eq(channels.slug, slug),
            eq(channels.workspaceId, workspaceId!)
          )
        );
    
    if (exists.length === 0) break;
    
    // If exists, append counter and try again
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

export async function addSlugs() {
  // First, add the columns with a default value
  await db.execute(sql`
    ALTER TABLE workspaces 
    ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '';

    ALTER TABLE channels 
    ADD COLUMN IF NOT EXISTS slug text NOT NULL DEFAULT '';
  `);

  // Get all workspaces and generate slugs
  const existingWorkspaces = await db.select().from(workspaces);
  for (const workspace of existingWorkspaces) {
    const slug = await generateUniqueSlug(workspace.name, 'workspaces');
    await db
      .update(workspaces)
      .set({ slug })
      .where(eq(workspaces.id, workspace.id));
  }

  // Get all channels and generate slugs
  const existingChannels = await db.select().from(channels);
  for (const channel of existingChannels) {
    const slug = await generateUniqueSlug(channel.name, 'channels', channel.workspaceId);
    await db
      .update(channels)
      .set({ slug })
      .where(eq(channels.id, channel.id));
  }

  // Make slug columns NOT NULL
  await db.execute(sql`
    ALTER TABLE workspaces 
    ALTER COLUMN slug SET NOT NULL;

    ALTER TABLE channels 
    ALTER COLUMN slug SET NOT NULL;
  `);

  // Add unique constraints
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces (slug);
    CREATE UNIQUE INDEX IF NOT EXISTS channels_workspace_slug_idx ON channels (workspace_id, slug);
  `);
} 