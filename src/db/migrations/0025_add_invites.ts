import { sql } from 'drizzle-orm'
import { db } from '..'

export async function up() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS invites_workspace_id_idx ON invites(workspace_id);
    CREATE INDEX IF NOT EXISTS invites_inviter_id_idx ON invites(inviter_id);
    CREATE INDEX IF NOT EXISTS invites_email_idx ON invites(email);
    CREATE INDEX IF NOT EXISTS invites_token_idx ON invites(token);
  `)
} 