import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  type PgTableWithColumns,
} from 'drizzle-orm/pg-core'

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull().default('public'),
  slug: text('slug').notNull(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const unreadMessages = pgTable('unread_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  channelId: uuid('channel_id').references(() => channels.id),
  dmChannelId: uuid('dm_channel_id').references(() => directMessageChannels.id),
  lastReadMessageId: uuid('last_read_message_id').references(() => messages.id),
  unreadCount: integer('unread_count').notNull().default(0),
  hasMention: boolean('has_mention').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Declare messages type to avoid circular reference
let messages: PgTableWithColumns<any>

// Initialize messages table
messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }),
  dmChannelId: uuid('dm_channel_id').references(() => directMessageChannels.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  aiGenerated: boolean('ai_generated').default(false),
  attachments: jsonb('attachments'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  editedAt: timestamp('edited_at'),
  // New columns for threading
  parentMessageId: uuid('parent_message_id'),
  replyCount: integer('reply_count').default(0).notNull(),
  latestReplyAt: timestamp('latest_reply_at'),
})

export { messages }

export const directMessageChannels = pgTable('direct_message_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const directMessageMembers = pgTable('direct_message_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => directMessageChannels.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  read: boolean('read').notNull().default(false),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

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

export const messagesRelations = relations(messages, ({ one, many }) => ({
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
  // Add thread relations with correct field mappings
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
  }),
  replies: many(messages),
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

export { invites } from './migrations/0021_add_invites_table' 