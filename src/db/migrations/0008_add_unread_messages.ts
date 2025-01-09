import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addUnreadMessages() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS unread_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      channel_id UUID REFERENCES channels(id),
      dm_channel_id UUID REFERENCES direct_message_channels(id),
      last_read_message_id UUID REFERENCES messages(id),
      unread_count INTEGER NOT NULL DEFAULT 0,
      has_mention BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT channel_check CHECK (
        (CASE WHEN channel_id IS NULL THEN 0 ELSE 1 END +
         CASE WHEN dm_channel_id IS NULL THEN 0 ELSE 1 END) = 1
      ),
      UNIQUE(user_id, channel_id),
      UNIQUE(user_id, dm_channel_id)
    );
  `);
} 