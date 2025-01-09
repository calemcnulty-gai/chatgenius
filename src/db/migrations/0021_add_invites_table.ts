import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { workspaces, users } from '../schema'

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id).notNull(),
  inviterId: uuid('inviter_id').references(() => users.id).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  token: uuid('token').notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
})

// Add indexes for common queries
export const inviteIndexes = [
  sql`CREATE INDEX IF NOT EXISTS invites_workspace_id_idx ON invites (workspace_id)`,
  sql`CREATE INDEX IF NOT EXISTS invites_email_idx ON invites (email)`,
  sql`CREATE INDEX IF NOT EXISTS invites_token_idx ON invites (token)`,
  sql`CREATE INDEX IF NOT EXISTS invites_status_idx ON invites (status)`,
] 