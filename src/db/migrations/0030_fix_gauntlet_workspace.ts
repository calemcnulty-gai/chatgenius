import { sql } from 'drizzle-orm'
import { db, pool } from '..'

export async function up() {
  // Find the most recent Gauntlet workspace
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
      WHERE workspace_id = $2;
    `, [latestGauntlet.id, oldGauntlet.id])

    // Move all channels to the latest Gauntlet
    await pool.query(`
      UPDATE channels 
      SET workspace_id = $1 
      WHERE workspace_id = $2;
    `, [latestGauntlet.id, oldGauntlet.id])

    // Delete the old workspace
    await pool.query(`
      DELETE FROM workspaces 
      WHERE id = $1;
    `, [oldGauntlet.id])
  }

  // Verify the unique constraint exists
  const { rows: [constraint] } = await pool.query<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1 
      FROM pg_constraint 
      WHERE conname = 'workspaces_slug_unique'
    ) as exists;
  `)

  if (!constraint.exists) {
    await pool.query(`
      ALTER TABLE workspaces 
      ADD CONSTRAINT workspaces_slug_unique UNIQUE (slug);
    `)
  }
}

export async function down() {
  // No down migration needed as we can't restore deleted workspaces
  console.log('No down migration for fix_gauntlet_workspace')
} 