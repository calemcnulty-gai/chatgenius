import { sql } from 'drizzle-orm'
import { db, pool } from '..'

// We'll use the same ID defined in 0026, but since it's not exported we'll define it here too
const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000003'

export async function up() {
  // Move only AI user messages from any general channel to the fixed general channel
  await pool.query(`
    UPDATE messages 
    SET channel_id = $1
    WHERE channel_id IN (
      SELECT id 
      FROM channels 
      WHERE slug = 'general'
      AND id != $1
    )
    AND sender_id IN (
      SELECT id 
      FROM users 
      WHERE clerk_id LIKE 'ai-%'
    );
  `, [GENERAL_CHANNEL_ID])

  // Note: We won't delete the other general channels as they may contain legitimate user messages
}

export async function down() {
  // No down migration needed as we can't determine the original channels
  console.log('No down migration for fix_ai_messages')
} 