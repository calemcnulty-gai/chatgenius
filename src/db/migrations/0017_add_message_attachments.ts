export const up = `
  ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachments JSONB;
`

export const down = `
  ALTER TABLE messages
  DROP COLUMN IF EXISTS attachments;
` 