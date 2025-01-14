import { sql } from 'drizzle-orm'
import { db, pool } from '..'

export async function up() {
  // Get the general channel from the most recent Gauntlet workspace
  const { rows: [generalChannel] } = await pool.query<{ id: string }>(`
    WITH latest_gauntlet AS (
      SELECT id 
      FROM workspaces 
      WHERE slug = 'gauntlet' 
      ORDER BY created_at DESC 
      LIMIT 1
    )
    SELECT c.id
    FROM channels c
    WHERE c.slug = 'general'
    AND c.workspace_id = (SELECT id FROM latest_gauntlet);
  `)

  if (!generalChannel) {
    console.log('No general channel found in latest Gauntlet workspace, skipping migration')
    return
  }

  // First move all messages (not just AI messages) to the correct general channel
  await pool.query(`
    UPDATE messages 
    SET channel_id = $1
    WHERE channel_id IN (
      SELECT c.id 
      FROM channels c
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE w.slug LIKE 'gauntlet%'
      AND c.id != $1
      AND (c.slug = 'general' OR c.slug = 'general-2')
    );
  `, [generalChannel.id])

  // Then delete the old general channels
  await pool.query(`
    DELETE FROM channels 
    WHERE id IN (
      SELECT c.id 
      FROM channels c
      JOIN workspaces w ON c.workspace_id = w.id
      WHERE w.slug LIKE 'gauntlet%'
      AND c.id != $1
      AND (c.slug = 'general' OR c.slug = 'general-2')
    );
  `, [generalChannel.id])
}

export async function down() {
  // No down migration needed as we can't determine the original channels
  console.log('No down migration for fix_ai_messages')
} 