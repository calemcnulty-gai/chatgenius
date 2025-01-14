import { sql } from 'drizzle-orm'
import { db } from '..'

export async function up() {
  await db.execute(sql`
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      profile_image TEXT,
      display_name TEXT,
      title TEXT,
      time_zone TEXT DEFAULT 'UTC',
      status TEXT DEFAULT 'offline',
      last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create workspaces table
    CREATE TABLE IF NOT EXISTS workspaces (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      owner_id UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create channels table
    CREATE TABLE IF NOT EXISTS channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private')),
      slug TEXT NOT NULL,
      workspace_id UUID NOT NULL REFERENCES workspaces(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      UNIQUE (workspace_id, slug)
    );

    -- Create direct_message_channels table
    CREATE TABLE IF NOT EXISTS direct_message_channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create direct_message_members table
    CREATE TABLE IF NOT EXISTS direct_message_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID NOT NULL REFERENCES direct_message_channels(id),
      user_id UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create messages table
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
      dm_channel_id UUID REFERENCES direct_message_channels(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      attachments JSONB,
      parent_message_id UUID REFERENCES messages(id),
      reply_count INTEGER DEFAULT 0 NOT NULL,
      latest_reply_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      edited_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create workspace_memberships table
    CREATE TABLE IF NOT EXISTS workspace_memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id),
      user_id UUID NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create unread_messages table
    CREATE TABLE IF NOT EXISTS unread_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      channel_id UUID REFERENCES channels(id),
      dm_channel_id UUID REFERENCES direct_message_channels(id),
      last_read_message_id UUID REFERENCES messages(id),
      unread_count INTEGER NOT NULL DEFAULT 0,
      has_mention BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    -- Create invites table
    CREATE TABLE IF NOT EXISTS invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id),
      inviter_id UUID NOT NULL REFERENCES users(id),
      email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      token TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `)
}

export async function down() {
  await db.execute(sql`
    DROP TABLE IF EXISTS "invites";
    DROP TABLE IF EXISTS "unread_messages";
    DROP TABLE IF EXISTS "notifications";
    DROP TABLE IF EXISTS "messages";
    DROP TABLE IF EXISTS "direct_message_members";
    DROP TABLE IF EXISTS "direct_message_channels";
    DROP TABLE IF EXISTS "channels";
    DROP TABLE IF EXISTS "workspace_memberships";
    DROP TABLE IF EXISTS "workspaces";
    DROP TABLE IF EXISTS "users";
  `)
} 