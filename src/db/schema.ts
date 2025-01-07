import { pgTable, text, timestamp, boolean, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  profileImage: text('profile_image'),
  status: text('status').default('active'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    emailIdx: uniqueIndex('email_idx').on(table.email)
  }
});

export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  slugIdx: uniqueIndex('workspaces_slug_idx').on(table.slug),
}));

export const workspaceMemberships = pgTable('workspace_memberships', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  role: text('role').default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => {
  return {
    uniqMembership: uniqueIndex('uniq_membership').on(table.workspaceId, table.userId)
  }
});

export const channels = pgTable('channels', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  type: text('type').default('public').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  slugIdx: uniqueIndex('channels_workspace_slug_idx').on(table.workspaceId, table.slug),
}));

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  channelId: text('channel_id')
    .notNull()
    .references(() => channels.id),
  senderId: text('sender_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  aiGenerated: boolean('ai_generated').default(false),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  editedAt: timestamp('edited_at')
});

export const aiInteractions = pgTable('ai_interactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  channelId: text('channel_id')
    .references(() => channels.id),
  type: text('type').notNull(),
  inputText: text('input_text').notNull(),
  outputText: text('output_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMemberships),
  messages: many(messages),
  aiInteractions: many(aiInteractions)
}));

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  memberships: many(workspaceMemberships),
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  channels: many(channels)
}));

export const channelsRelations = relations(channels, ({ many, one }) => ({
  messages: many(messages),
  workspace: one(workspaces, {
    fields: [channels.workspaceId],
    references: [workspaces.id]
  })
}));

export const workspaceMembershipRelations = relations(workspaceMemberships, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMemberships.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMemberships.userId],
    references: [users.id],
  }),
}));

// Add message relations
export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
}));

// Update user relations to include sent messages
export const userRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMemberships),
  messages: many(messages),
  aiInteractions: many(aiInteractions),
}));

// Update channel relations to include messages
export const channelRelations = relations(channels, ({ many, one }) => ({
  messages: many(messages),
  workspace: one(workspaces, {
    fields: [channels.workspaceId],
    references: [workspaces.id],
  }),
})); 