import { relations, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import {
  pgTable,
  text,
  uuid,
  boolean,
  integer,
  jsonb,
  type PgTableWithColumns,
} from 'drizzle-orm/pg-core'
import { timestampString } from './timestamp'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  profileImage: text('profile_image'),
  displayName: text('display_name'),
  title: text('title'),
  timeZone: text('time_zone').default('UTC'),
  status: text('status').default('offline'),
  lastHeartbeat: timestampString('last_heartbeat').default(sql`CURRENT_TIMESTAMP`),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestampString('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestampString('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type', { enum: ['public', 'private'] }).notNull().default('public'),
  slug: text('slug').notNull(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestampString('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const directMessageChannels = pgTable('direct_message_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestampString('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

// Define table structure first
const messagesConfig = {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }),
  dmChannelId: uuid('dm_channel_id').references(() => directMessageChannels.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  attachments: jsonb('attachments'),
  parentMessageId: uuid('parent_message_id'),  // Add reference after table creation
  replyCount: integer('reply_count').notNull().default(0),
  latestReplyAt: timestampString('latest_reply_at'),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  editedAt: timestampString('edited_at'),
  updatedAt: timestampString('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
} as const;

// Create table
export const messages = pgTable('messages', messagesConfig);

// Add self-reference after table creation
messagesConfig.parentMessageId.references(() => messages.id);

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  dmChannel: one(directMessageChannels, {
    fields: [messages.dmChannelId],
    references: [directMessageChannels.id],
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
  }),
}))

export const unreadMessages = pgTable('unread_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  channelId: uuid('channel_id').references(() => channels.id),
  dmChannelId: uuid('dm_channel_id').references(() => directMessageChannels.id),
  lastReadMessageId: uuid('last_read_message_id').references(() => messages.id),
  unreadCount: integer('unread_count').notNull().default(0),
  hasMention: boolean('has_mention').notNull().default(false),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestampString('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const workspaceMemberships = pgTable('workspace_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  role: text('role').notNull().default('member'),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestampString('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const directMessageMembers = pgTable('direct_message_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => directMessageChannels.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  inviterId: uuid('inviter_id').notNull().references(() => users.id),
  email: text('email').notNull(),
  status: text('status').notNull().default('pending'),
  token: text('token').notNull(),
  expiresAt: timestampString('expires_at').notNull(),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestampString('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const invitesRelations = relations(invites, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [invites.workspaceId],
    references: [workspaces.id],
  }),
  inviter: one(users, {
    fields: [invites.inviterId],
    references: [users.id],
  }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  workspaceMemberships: many(workspaceMemberships),
  messages: many(messages),
  notifications: many(notifications),
}))

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  channels: many(channels),
  memberships: many(workspaceMemberships),
  directMessageChannels: many(directMessageChannels),
}))

export const channelsRelations = relations(channels, ({ many, one }) => ({
  messages: many(messages),
  workspace: one(workspaces, {
    fields: [channels.workspaceId],
    references: [workspaces.id],
  }),
  unreadMessages: many(unreadMessages),
}))

export const directMessageChannelsRelations = relations(directMessageChannels, ({ many, one }) => ({
  messages: many(messages),
  members: many(directMessageMembers),
  workspace: one(workspaces, {
    fields: [directMessageChannels.workspaceId],
    references: [workspaces.id],
  }),
  unreadMessages: many(unreadMessages),
}))

export const directMessageMembersRelations = relations(directMessageMembers, ({ one }) => ({
  channel: one(directMessageChannels, {
    fields: [directMessageMembers.channelId],
    references: [directMessageChannels.id],
  }),
  user: one(users, {
    fields: [directMessageMembers.userId],
    references: [users.id],
  }),
}))

export const unreadMessagesRelations = relations(unreadMessages, ({ one }) => ({
  user: one(users, {
    fields: [unreadMessages.userId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [unreadMessages.channelId],
    references: [channels.id],
  }),
  dmChannel: one(directMessageChannels, {
    fields: [unreadMessages.dmChannelId],
    references: [directMessageChannels.id],
  }),
}))

export const workspaceMembershipsRelations = relations(workspaceMemberships, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMemberships.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMemberships.userId],
    references: [users.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))

// Export query config
export const queryConfig = {
  workspaces,
  users,
  channels,
  messages,
  workspaceMemberships,
  directMessageChannels,
  directMessageMembers,
  notifications,
  invites,
  unreadMessages,
} as const 