import { sql } from 'drizzle-orm'
import { db } from '..'

export async function standardizeAllTimestamps() {
  // Users table
  await db.execute(sql`
    ALTER TABLE users
    ALTER COLUMN last_heartbeat TYPE TIMESTAMPTZ USING last_heartbeat AT TIME ZONE 'UTC',
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
  `)

  // Workspaces table
  await db.execute(sql`
    ALTER TABLE workspaces
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
  `)

  // Channels table
  await db.execute(sql`
    ALTER TABLE channels
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
  `)

  // Unread messages table
  await db.execute(sql`
    ALTER TABLE unread_messages
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
  `)

  // Workspace memberships table
  await db.execute(sql`
    ALTER TABLE workspace_memberships
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
  `)

  // Messages table
  await db.execute(sql`
    ALTER TABLE messages
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN edited_at TYPE TIMESTAMPTZ USING edited_at AT TIME ZONE 'UTC',
    ALTER COLUMN latest_reply_at TYPE TIMESTAMPTZ USING latest_reply_at AT TIME ZONE 'UTC';
  `)

  // Direct message channels table
  await db.execute(sql`
    ALTER TABLE direct_message_channels
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';
  `)

  // Direct message members table
  await db.execute(sql`
    ALTER TABLE direct_message_members
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
  `)

  // Notifications table
  await db.execute(sql`
    ALTER TABLE notifications
    ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
  `)
} 