import { sql } from 'drizzle-orm'
import { db } from '..'

export async function initialSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "clerk_id" TEXT NOT NULL UNIQUE,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "profile_image" TEXT,
      "settings" JSONB,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "workspaces" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
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
      "type" TEXT DEFAULT 'public' NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE
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
  `)
} 