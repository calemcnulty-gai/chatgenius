import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addUserProfileFields() {
  await db.execute(sql`
    ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "display_name" TEXT,
    ADD COLUMN IF NOT EXISTS "title" TEXT,
    ADD COLUMN IF NOT EXISTS "time_zone" TEXT DEFAULT 'UTC';
  `)
} 