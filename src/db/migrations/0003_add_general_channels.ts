import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '..'

export async function up() {
  // Get all workspaces
  const { rows: workspaces } = await db.execute(sql`
    SELECT id FROM workspaces;
  `)

  // Add a general channel to each workspace
  for (const workspace of workspaces) {
    await db.execute(sql`
      INSERT INTO channels (
        id,
        workspace_id,
        name,
        slug,
        type
      )
      VALUES (
        ${uuidv4()},
        ${workspace.id},
        'general',
        'general',
        'public'
      )
      ON CONFLICT (workspace_id, slug) DO NOTHING;
    `)
  }
}

export async function down() {
  await db.execute(sql`
    DELETE FROM channels WHERE name = 'general';
  `)
} 