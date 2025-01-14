import { sql } from 'drizzle-orm'
import { db } from '..'

export async function up() {
  await db.execute(sql`
    ALTER TABLE users
    DROP COLUMN IF EXISTS auth_provider,
    DROP COLUMN IF EXISTS provider_account_id,
    DROP COLUMN IF EXISTS email_verified;

    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS verification_tokens;
  `)
}

export async function down() {
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth_provider TEXT,
    ADD COLUMN IF NOT EXISTS provider_account_id TEXT,
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
  `)
} 