import { sql } from 'drizzle-orm'
import { db, pool } from '..'
import { v4 as uuidv4 } from 'uuid'
import { createTimestamp } from './utils'

// Use fixed UUIDs for system entities to prevent duplicates
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'
const GAUNTLET_WORKSPACE_ID = '00000000-0000-0000-0000-000000000002'
const GENERAL_CHANNEL_ID = '00000000-0000-0000-0000-000000000003'

export async function addGauntletWorkspace() {
  // Create a system user for the Gauntlet workspace if it doesn't exist
  await db.execute(sql`
    INSERT INTO users (id, clerk_id, name, email, profile_image, time_zone, status, created_at, updated_at)
    VALUES (
      ${SYSTEM_USER_ID},
      'system',
      'System',
      'system@chatgenius.local',
      NULL,
      'UTC',
      'active',
      ${createTimestamp(new Date())},
      ${createTimestamp(new Date())}
    )
    ON CONFLICT (clerk_id) DO NOTHING
    RETURNING id;
  `)

  // Get the system user ID
  const { rows: [systemUser] } = await pool.query<{ id: string }>(`
    SELECT id FROM users WHERE clerk_id = 'system';
  `)

  // Create the Gauntlet workspace if it doesn't exist
  await db.execute(sql`
    INSERT INTO workspaces (id, name, description, owner_id, slug, created_at, updated_at)
    VALUES (
      ${GAUNTLET_WORKSPACE_ID},
      'Gauntlet',
      'The default workspace for all users',
      ${systemUser.id},
      'gauntlet',
      ${createTimestamp(new Date())},
      ${createTimestamp(new Date())}
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id;
  `)

  // Get the Gauntlet workspace ID
  const { rows: [gauntletWorkspace] } = await pool.query<{ id: string }>(`
    SELECT id FROM workspaces WHERE slug = 'gauntlet';
  `)

  // Create the #general channel if it doesn't exist
  await db.execute(sql`
    INSERT INTO channels (id, workspace_id, name, slug, type, created_at, updated_at)
    VALUES (
      ${GENERAL_CHANNEL_ID},
      ${gauntletWorkspace.id},
      'general',
      'general',
      'public',
      ${createTimestamp(new Date())},
      ${createTimestamp(new Date())}
    )
    ON CONFLICT (id) DO NOTHING;
  `)
} 