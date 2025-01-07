import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addNotifications() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      read BOOLEAN NOT NULL DEFAULT false,
      data JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );
  `)
} 