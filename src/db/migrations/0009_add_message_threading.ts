import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addMessageThreading() {
  // Add new columns to messages table
  await db.execute(sql`
    -- Add parent_message_id for threading
    ALTER TABLE messages
    ADD COLUMN parent_message_id TEXT REFERENCES messages(id),
    -- Add reply count for performance
    ADD COLUMN reply_count INTEGER NOT NULL DEFAULT 0,
    -- Add latest reply timestamp for sorting/display
    ADD COLUMN latest_reply_at TIMESTAMP;

    -- Create an index for faster thread lookups
    CREATE INDEX messages_parent_message_id_idx ON messages(parent_message_id);

    -- Create an index for sorting by latest reply
    CREATE INDEX messages_latest_reply_at_idx ON messages(latest_reply_at);

    -- Add a check constraint to ensure a message can't be its own parent
    ALTER TABLE messages
    ADD CONSTRAINT message_parent_check 
    CHECK (id != parent_message_id);
  `);
} 