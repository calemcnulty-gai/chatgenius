export const up = `
  ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES messages(id),
  ADD COLUMN IF NOT EXISTS reply_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latest_reply_at TIMESTAMP WITH TIME ZONE;
`

export const down = `
  ALTER TABLE messages
  DROP COLUMN IF EXISTS edited_at,
  DROP COLUMN IF EXISTS parent_message_id,
  DROP COLUMN IF EXISTS reply_count,
  DROP COLUMN IF EXISTS latest_reply_at;
` 