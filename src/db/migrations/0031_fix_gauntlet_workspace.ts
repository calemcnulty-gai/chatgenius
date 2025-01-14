import { sql } from 'drizzle-orm'
import { db, pool } from '..'

export async function up() {
  // First, find the most recent Gauntlet workspace
  const { rows: [latestGauntlet] } = await pool.query<{ id: string }>(`
    SELECT id
    FROM workspaces
    WHERE slug = 'gauntlet'
    ORDER BY created_at DESC
    LIMIT 1;
  `)

  if (!latestGauntlet) {
    console.log('No Gauntlet workspace found, skipping migration')
    return
  }

  // Get all other Gauntlet workspaces
  const { rows: oldGauntlets } = await pool.query<{ id: string }>(`
    SELECT id
    FROM workspaces
    WHERE slug = 'gauntlet'
      AND id != $1
    ORDER BY created_at DESC;
  `, [latestGauntlet.id])

  // For each old Gauntlet workspace
  for (const oldGauntlet of oldGauntlets) {
    // Move all workspace memberships to the latest Gauntlet
    await pool.query(`
      UPDATE workspace_memberships
      SET workspace_id = $1
      WHERE workspace_id = $2
        AND NOT EXISTS (
          SELECT 1
          FROM workspace_memberships
          WHERE workspace_id = $1
            AND user_id = workspace_memberships.user_id
        );
    `, [latestGauntlet.id, oldGauntlet.id])

    // Move all channels to the latest Gauntlet
    await pool.query(`
      UPDATE channels
      SET workspace_id = $1
      WHERE workspace_id = $2
        AND NOT EXISTS (
          SELECT 1
          FROM channels
          WHERE workspace_id = $1
            AND slug = channels.slug
        );
    `, [latestGauntlet.id, oldGauntlet.id])

    // Delete the old workspace
    await pool.query(`
      DELETE FROM workspaces
      WHERE id = $1;
    `, [oldGauntlet.id])
  }

  // Add unique constraint on slug
  await db.execute(sql`
    ALTER TABLE workspaces
    ADD CONSTRAINT workspaces_slug_unique UNIQUE (slug);
  `)
}

export async function down() {
  await db.execute(sql`
    ALTER TABLE workspaces
    DROP CONSTRAINT workspaces_slug_unique;
  `)
} 