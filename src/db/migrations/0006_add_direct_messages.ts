import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addDirectMessages() {
  // Create direct message channels table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS direct_message_channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Create direct message members table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS direct_message_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL REFERENCES direct_message_channels(id),
      user_id UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(channel_id, user_id)
    );
  `)

  // Alter messages table to support DMs
  await db.execute(sql`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS dm_channel_id UUID REFERENCES direct_message_channels(id) ON DELETE CASCADE,
    DROP CONSTRAINT IF EXISTS messages_channel_id_fkey,
    ALTER COLUMN channel_id DROP NOT NULL,
    ADD CONSTRAINT messages_channel_id_fkey 
      FOREIGN KEY (channel_id) 
      REFERENCES channels(id) 
      ON DELETE CASCADE;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'channel_check'
      ) THEN
        ALTER TABLE messages
        ADD CONSTRAINT channel_check 
          CHECK (
            (CASE WHEN channel_id IS NULL THEN 0 ELSE 1 END +
             CASE WHEN dm_channel_id IS NULL THEN 0 ELSE 1 END) = 1
          );
      END IF;
    END $$;
  `)
} 