import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addLastHeartbeat() {
  await db.execute(sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  `)
} 