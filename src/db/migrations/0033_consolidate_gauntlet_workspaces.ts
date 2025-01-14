import { sql } from 'drizzle-orm'
import { db, pool } from '..'

export async function up() {
  // First, find the canonical Gauntlet workspace (the one with the most real users)
  const { rows: [canonicalWorkspace] } = await pool.query<{ id: string }>(`
    WITH workspace_user_counts AS (
      SELECT 
        w.id,
        COUNT(DISTINCT CASE WHEN u.clerk_id NOT LIKE 'ai-%' THEN u.id END) as real_users
      FROM workspaces w
      JOIN workspace_memberships wm ON w.id = wm.workspace_id
      JOIN users u ON wm.user_id = u.id
      WHERE w.slug LIKE 'gauntlet%'
      GROUP BY w.id
      ORDER BY COUNT(DISTINCT CASE WHEN u.clerk_id NOT LIKE 'ai-%' THEN u.id END) DESC,
               w.created_at DESC
      LIMIT 1
    )
    SELECT id FROM workspace_user_counts;
  `)

  if (!canonicalWorkspace) {
    console.log('No Gauntlet workspace found, skipping migration')
    return
  }

  // Move all users to the canonical workspace
  await pool.query(`
    INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at, updated_at)
    SELECT 
      gen_random_uuid(),
      $1,
      wm.user_id,
      'member',
      NOW(),
      NOW()
    FROM workspace_memberships wm
    JOIN workspaces w ON wm.workspace_id = w.id
    WHERE w.slug LIKE 'gauntlet%'
    AND w.id != $1
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  `, [canonicalWorkspace.id])

  // Move all channels to the canonical workspace
  await pool.query(`
    UPDATE channels
    SET workspace_id = $1
    WHERE workspace_id IN (
      SELECT id FROM workspaces 
      WHERE slug LIKE 'gauntlet%'
      AND id != $1
    );
  `, [canonicalWorkspace.id])

  // Delete memberships from other gauntlet workspaces
  await pool.query(`
    DELETE FROM workspace_memberships
    WHERE workspace_id IN (
      SELECT id FROM workspaces 
      WHERE slug LIKE 'gauntlet%'
      AND id != $1
    );
  `, [canonicalWorkspace.id])

  // Delete all other gauntlet workspaces
  await pool.query(`
    DELETE FROM workspaces 
    WHERE slug LIKE 'gauntlet%'
    AND id != $1;
  `, [canonicalWorkspace.id])

  // Update the canonical workspace to have the correct slug
  await pool.query(`
    UPDATE workspaces
    SET slug = 'gauntlet'
    WHERE id = $1;
  `, [canonicalWorkspace.id])
}

export async function down() {
  // No down migration needed as we don't want to recreate duplicate workspaces
} 