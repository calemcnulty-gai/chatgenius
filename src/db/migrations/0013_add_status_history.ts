import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addStatusHistory() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS user_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      status TEXT NOT NULL,
      status_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS user_status_history_user_id_idx ON user_status_history(user_id);
  `)
} 