import { sql } from 'drizzle-orm'

export async function up() {
  await sql`ALTER TABLE users ADD COLUMN clerk_id TEXT NOT NULL UNIQUE`
}

export async function down() {
  await sql`ALTER TABLE users DROP COLUMN clerk_id`
} 