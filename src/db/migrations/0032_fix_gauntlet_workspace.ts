import { sql } from 'drizzle-orm'
import { db, pool } from '..'

const GAUNTLET_WORKSPACE_ID = '8903c486-7dc5-4d2b-b973-e25ae786f6d7'

export async function up() {
  // Move all users to the correct Gauntlet workspace
  await db.execute(sql`
    INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at, updated_at)
    SELECT 
      gen_random_uuid(),
      ${GAUNTLET_WORKSPACE_ID},
      u.id,
      'member',
      NOW(),
      NOW()
    FROM users u
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  `)

  // Move all channels from other Gauntlet workspaces to the correct one
  await db.execute(sql`
    UPDATE channels
    SET workspace_id = ${GAUNTLET_WORKSPACE_ID}
    WHERE workspace_id IN (
      SELECT id FROM workspaces 
      WHERE slug = 'gauntlet' 
      AND id != ${GAUNTLET_WORKSPACE_ID}
    );
  `)

  // Move unread messages to the correct channel
  await db.execute(sql`
    WITH old_channels AS (
      SELECT c.id
      FROM channels c
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE w.slug = 'gauntlet'
      AND c.slug IN ('general', 'general-2')
      AND c.id != (
        SELECT id 
        FROM channels 
        WHERE workspace_id = ${GAUNTLET_WORKSPACE_ID} 
        AND slug = 'general'
        ORDER BY created_at DESC 
        LIMIT 1
      )
    )
    UPDATE unread_messages
    SET channel_id = (
      SELECT id 
      FROM channels 
      WHERE workspace_id = ${GAUNTLET_WORKSPACE_ID} 
      AND slug = 'general'
      ORDER BY created_at DESC 
      LIMIT 1
    )
    WHERE channel_id IN (SELECT id FROM old_channels);
  `)

  // Delete all other Gauntlet workspaces
  await db.execute(sql`
    DELETE FROM workspaces 
    WHERE slug = 'gauntlet' 
    AND id != ${GAUNTLET_WORKSPACE_ID};
  `)
}

export async function down() {
  // No down migration needed as we don't want to recreate duplicate workspaces
} 