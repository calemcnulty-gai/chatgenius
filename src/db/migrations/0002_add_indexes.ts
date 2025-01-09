import { sql } from 'drizzle-orm'
import { db } from '..'

export async function addIndexes() {
  await db.execute(sql`
    -- Create indexes for foreign keys for better join performance
    CREATE INDEX IF NOT EXISTS workspace_memberships_workspace_id_idx ON workspace_memberships(workspace_id);
    CREATE INDEX IF NOT EXISTS workspace_memberships_user_id_idx ON workspace_memberships(user_id);
    CREATE INDEX IF NOT EXISTS channels_workspace_id_idx ON channels(workspace_id);
    CREATE INDEX IF NOT EXISTS ai_interactions_user_id_idx ON ai_interactions(user_id);
    CREATE INDEX IF NOT EXISTS ai_interactions_workspace_id_idx ON ai_interactions(workspace_id);
    CREATE INDEX IF NOT EXISTS ai_interactions_channel_id_idx ON ai_interactions(channel_id);

    -- Create indexes for commonly searched fields
    CREATE INDEX IF NOT EXISTS users_name_idx ON users(name);
    CREATE INDEX IF NOT EXISTS workspaces_name_idx ON workspaces(name);
    CREATE INDEX IF NOT EXISTS channels_name_idx ON channels(name);
  `)
} 