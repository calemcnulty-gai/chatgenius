import { sql } from 'drizzle-orm'
import { db } from '..'

export async function standardizeTimestamps() {
  await db.execute(sql`
    ALTER TABLE invites
    ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE,
    ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE,
    ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE;
  `)
} 