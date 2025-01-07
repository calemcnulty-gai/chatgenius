import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '..'
import { workspaces, channels } from '../schema'
import { eq } from 'drizzle-orm'
import { generateSlug } from '@/lib/utils'

export async function addSlugs() {
  // First, add the columns
  await sql`
    ALTER TABLE workspaces 
    ADD COLUMN IF NOT EXISTS slug text;

    ALTER TABLE channels 
    ADD COLUMN IF NOT EXISTS slug text;
  `.execute(db);

  // Get all workspaces and generate slugs
  const existingWorkspaces = await db.select().from(workspaces);
  for (const workspace of existingWorkspaces) {
    const slug = generateSlug(workspace.name);
    await db
      .update(workspaces)
      .set({ slug })
      .where(eq(workspaces.id, workspace.id));
  }

  // Get all channels and generate slugs
  const existingChannels = await db.select().from(channels);
  for (const channel of existingChannels) {
    const slug = generateSlug(channel.name);
    await db
      .update(channels)
      .set({ slug })
      .where(eq(channels.id, channel.id));
  }

  // Make slug columns NOT NULL
  await sql`
    ALTER TABLE workspaces 
    ALTER COLUMN slug SET NOT NULL;

    ALTER TABLE channels 
    ALTER COLUMN slug SET NOT NULL;
  `.execute(db);

  // Add unique constraints
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces (slug);
    CREATE UNIQUE INDEX IF NOT EXISTS channels_workspace_slug_idx ON channels (workspace_id, slug);
  `.execute(db);
} 