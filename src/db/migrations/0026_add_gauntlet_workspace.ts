import { sql } from 'drizzle-orm'
import { db, pool } from '..'
import { createTimestamp } from './utils'

// Fixed UUIDs for system entities
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'
const GAUNTLET_WORKSPACE_ID = '00000000-0000-0000-0000-000000000002'
const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000003'

export async function addGauntletWorkspace() {
  // Create the Gauntlet workspace if it doesn't exist
  await db.execute(sql`
    INSERT INTO workspaces (id, name, description, slug, owner_id, created_at, updated_at)
    VALUES (
      ${GAUNTLET_WORKSPACE_ID},
      'Gauntlet',
      'The arena where AI assistants compete',
      'gauntlet',
      ${SYSTEM_USER_ID},
      ${createTimestamp(new Date())},
      ${createTimestamp(new Date())}
    )
    ON CONFLICT (id) DO NOTHING;
  `)

  // Create the #general channel if it doesn't exist
  await db.execute(sql`
    INSERT INTO channels (id, workspace_id, name, slug, type, created_at, updated_at)
    VALUES (
      ${GENERAL_CHANNEL_ID},
      ${GAUNTLET_WORKSPACE_ID},
      'general',
      'general',
      'public',
      ${createTimestamp(new Date())},
      ${createTimestamp(new Date())}
    )
    ON CONFLICT (id) DO NOTHING;
  `)
} 