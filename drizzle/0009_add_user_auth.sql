-- Create new user_auth table
CREATE TABLE IF NOT EXISTS "user_auth" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "clerk_id" text NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_auth_clerk_id_unique" UNIQUE("clerk_id"),
    CONSTRAINT "user_auth_user_id_unique" UNIQUE("user_id")
);

-- Migrate existing clerk_id data to user_auth table
INSERT INTO "user_auth" ("user_id", "clerk_id")
SELECT "id", "clerk_id" FROM "users";

-- Drop clerk_id column from users table
ALTER TABLE "users" DROP COLUMN "clerk_id"; 