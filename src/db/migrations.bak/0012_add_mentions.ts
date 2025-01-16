import { sql } from 'drizzle-orm'
import { db } from '..'

export async function up() {
  await db.execute(sql`
    -- Create mentions table
    CREATE TABLE IF NOT EXISTS mentions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      read_at TIMESTAMP WITH TIME ZONE,
      UNIQUE(message_id, user_id)
    );

    -- Create channel_mentions table to track unread mentions per channel
    CREATE TABLE IF NOT EXISTS channel_mentions (
      channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      unread_count INTEGER NOT NULL DEFAULT 0,
      last_mention_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      PRIMARY KEY (channel_id, user_id)
    );

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS mentions_user_id_idx ON mentions(user_id);
    CREATE INDEX IF NOT EXISTS mentions_channel_id_idx ON mentions(channel_id);
    CREATE INDEX IF NOT EXISTS mentions_message_id_idx ON mentions(message_id);
    CREATE INDEX IF NOT EXISTS mentions_read_at_idx ON mentions(read_at);
    CREATE INDEX IF NOT EXISTS channel_mentions_last_mention_at_idx ON channel_mentions(last_mention_at);

    -- Add trigger to update channel_mentions on new mention
    CREATE OR REPLACE FUNCTION update_channel_mentions()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO channel_mentions (channel_id, user_id, unread_count, last_mention_at)
      VALUES (NEW.channel_id, NEW.user_id, 1, NEW.created_at)
      ON CONFLICT (channel_id, user_id) DO UPDATE
      SET 
        unread_count = channel_mentions.unread_count + 1,
        last_mention_at = NEW.created_at;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER mentions_update_channel_mentions
    AFTER INSERT ON mentions
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_mentions();
  `)
}

export async function down() {
  await db.execute(sql`
    -- Drop trigger first
    DROP TRIGGER IF EXISTS mentions_update_channel_mentions ON mentions;
    DROP FUNCTION IF EXISTS update_channel_mentions;

    -- Drop indexes
    DROP INDEX IF EXISTS mentions_user_id_idx;
    DROP INDEX IF EXISTS mentions_channel_id_idx;
    DROP INDEX IF EXISTS mentions_message_id_idx;
    DROP INDEX IF EXISTS mentions_read_at_idx;
    DROP INDEX IF EXISTS channel_mentions_last_mention_at_idx;

    -- Drop tables
    DROP TABLE IF EXISTS channel_mentions;
    DROP TABLE IF EXISTS mentions;
  `)
} 