export const up = `
  ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;
`

export const down = `
  ALTER TABLE messages
  DROP COLUMN IF EXISTS ai_generated;
` 