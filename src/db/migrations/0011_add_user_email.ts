import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addUserEmail() {
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email TEXT NOT NULL;
  `)
} 