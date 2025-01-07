import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addWorkspaceOwner() {
  await db.execute(sql`
    ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS owner_id TEXT NOT NULL REFERENCES users(id);
  `)
} 