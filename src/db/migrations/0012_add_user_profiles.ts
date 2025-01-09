import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addUserProfiles() {
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline',
    ADD COLUMN IF NOT EXISTS status_message TEXT,
    ADD COLUMN IF NOT EXISTS time_zone TEXT,
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS about_me TEXT,
    ADD COLUMN IF NOT EXISTS display_name TEXT;
  `)
} 