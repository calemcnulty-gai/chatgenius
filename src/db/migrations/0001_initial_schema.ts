import { sql } from 'drizzle-orm'
import { db } from '..'

export async function up(db: any) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "clerk_id" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "profile_image" TEXT,
      "display_name" TEXT,
      "title" TEXT,
      "settings" JSONB,
      "time_zone" TEXT DEFAULT 'UTC',
      "status" TEXT DEFAULT 'offline',
      "last_heartbeat" TIMESTAMP WITH TIME ZONE,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "workspaces" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "owner_id" UUID NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("owner_id") REFERENCES "users" ("id") ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "workspace_memberships" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "workspace_id" UUID NOT NULL,
      "user_id" UUID NOT NULL,
      "role" TEXT DEFAULT 'member' NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
      UNIQUE ("workspace_id", "user_id")
    );

    CREATE TABLE IF NOT EXISTS "channels" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "workspace_id" UUID NOT NULL,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "type" TEXT DEFAULT 'public' NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE,
      UNIQUE ("workspace_id", "slug")
    );

    CREATE TABLE IF NOT EXISTS "messages" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "workspace_id" UUID NOT NULL,
      "channel_id" UUID,
      "user_id" UUID NOT NULL,
      "thread_id" UUID,
      "reply_to_id" UUID,
      "content" TEXT NOT NULL,
      "ai_generated" BOOLEAN DEFAULT FALSE,
      "attachments" JSONB,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("thread_id") REFERENCES "messages" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("reply_to_id") REFERENCES "messages" ("id") ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS "direct_messages" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "workspace_id" UUID NOT NULL,
      "sender_id" UUID NOT NULL,
      "recipient_id" UUID NOT NULL,
      "content" TEXT NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("recipient_id") REFERENCES "users" ("id") ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "notifications" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" UUID NOT NULL,
      "workspace_id" UUID NOT NULL,
      "channel_id" UUID,
      "message_id" UUID,
      "type" TEXT NOT NULL,
      "read" BOOLEAN DEFAULT FALSE,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("message_id") REFERENCES "messages" ("id") ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "unread_messages" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" UUID NOT NULL,
      "message_id" UUID NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("message_id") REFERENCES "messages" ("id") ON DELETE CASCADE,
      UNIQUE ("user_id", "message_id")
    );

    CREATE TABLE IF NOT EXISTS "status_history" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" UUID NOT NULL,
      "status" TEXT NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "ai_interactions" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" UUID NOT NULL,
      "workspace_id" UUID NOT NULL,
      "channel_id" UUID,
      "type" TEXT NOT NULL,
      "input_text" TEXT NOT NULL,
      "output_text" TEXT NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("channel_id") REFERENCES "channels" ("id") ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS "invites" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "workspace_id" UUID NOT NULL,
      "inviter_id" UUID NOT NULL,
      "email" TEXT NOT NULL,
      "status" TEXT DEFAULT 'pending' NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE,
      FOREIGN KEY ("inviter_id") REFERENCES "users" ("id") ON DELETE CASCADE
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS "workspace_memberships_workspace_id_idx" ON "workspace_memberships" ("workspace_id");
    CREATE INDEX IF NOT EXISTS "workspace_memberships_user_id_idx" ON "workspace_memberships" ("user_id");
    CREATE INDEX IF NOT EXISTS "channels_workspace_id_idx" ON "channels" ("workspace_id");
    CREATE INDEX IF NOT EXISTS "messages_workspace_id_idx" ON "messages" ("workspace_id");
    CREATE INDEX IF NOT EXISTS "messages_channel_id_idx" ON "messages" ("channel_id");
    CREATE INDEX IF NOT EXISTS "messages_user_id_idx" ON "messages" ("user_id");
    CREATE INDEX IF NOT EXISTS "messages_thread_id_idx" ON "messages" ("thread_id");
    CREATE INDEX IF NOT EXISTS "direct_messages_workspace_id_idx" ON "direct_messages" ("workspace_id");
    CREATE INDEX IF NOT EXISTS "direct_messages_sender_id_idx" ON "direct_messages" ("sender_id");
    CREATE INDEX IF NOT EXISTS "direct_messages_recipient_id_idx" ON "direct_messages" ("recipient_id");
    CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" ("user_id");
    CREATE INDEX IF NOT EXISTS "notifications_workspace_id_idx" ON "notifications" ("workspace_id");
    CREATE INDEX IF NOT EXISTS "notifications_channel_id_idx" ON "notifications" ("channel_id");
    CREATE INDEX IF NOT EXISTS "unread_messages_user_id_idx" ON "unread_messages" ("user_id");
    CREATE INDEX IF NOT EXISTS "status_history_user_id_idx" ON "status_history" ("user_id");
    CREATE INDEX IF NOT EXISTS "ai_interactions_user_id_idx" ON "ai_interactions" ("user_id");
    CREATE INDEX IF NOT EXISTS "ai_interactions_workspace_id_idx" ON "ai_interactions" ("workspace_id");
    CREATE INDEX IF NOT EXISTS "invites_workspace_id_idx" ON "invites" ("workspace_id");
    CREATE INDEX IF NOT EXISTS "invites_inviter_id_idx" ON "invites" ("inviter_id");
  `)
}

export async function down(db: any) {
  await db.execute(sql`
    DROP TABLE IF EXISTS "invites";
    DROP TABLE IF EXISTS "ai_interactions";
    DROP TABLE IF EXISTS "status_history";
    DROP TABLE IF EXISTS "unread_messages";
    DROP TABLE IF EXISTS "notifications";
    DROP TABLE IF EXISTS "direct_messages";
    DROP TABLE IF EXISTS "messages";
    DROP TABLE IF EXISTS "channels";
    DROP TABLE IF EXISTS "workspace_memberships";
    DROP TABLE IF EXISTS "workspaces";
    DROP TABLE IF EXISTS "users";
  `)
} 