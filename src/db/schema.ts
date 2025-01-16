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
  uniqueIndex,
  timestamp,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { timestampString } from './timestamp'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
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

export const userAuth = pgTable('user_auth', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  clerkId: text('clerk_id').notNull().unique(),
  createdAt: timestampString('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestampString('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
})

export const userAuthRelations = relations(userAuth, ({ one }) => ({
  user: one(users, {
    fields: [userAuth.userId],
    references: [users.id],
  }),
}))

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
}, (table) => ({
  userChannelUnique: uniqueIndex('unread_messages_user_id_channel_id_key').on(table.userId, table.channelId),
  userDmChannelUnique: uniqueIndex('unread_messages_user_id_dm_channel_id_key').on(table.userId, table.dmChannelId),
}))

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
  mentions: many(mentions),
  channelMentions: many(channelMentions),
  userAuth: many(userAuth),
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
  mentions: many(mentions),
  channelMentions: many(channelMentions),
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

export const mentions = pgTable('mentions', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp('read_at', { withTimezone: true })
}, (table) => ({
  messageUserUnique: uniqueIndex('message_user_unique').on(table.messageId, table.userId),
  userIdx: index('mentions_user_id_idx').on(table.userId),
  channelIdx: index('mentions_channel_id_idx').on(table.channelId),
  messageIdx: index('mentions_message_id_idx').on(table.messageId),
  readAtIdx: index('mentions_read_at_idx').on(table.readAt)
}))

export const channelMentions = pgTable('channel_mentions', {
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  unreadCount: integer('unread_count').notNull().default(0),
  lastMentionAt: timestamp('last_mention_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  pk: primaryKey({ columns: [table.channelId, table.userId] }),
  lastMentionAtIdx: index('channel_mentions_last_mention_at_idx').on(table.lastMentionAt)
}))

export const mentionsRelations = relations(mentions, ({ one }) => ({
  message: one(messages, {
    fields: [mentions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [mentions.userId],
    references: [users.id],
  }),
  channel: one(channels, {
    fields: [mentions.channelId],
    references: [channels.id],
  }),
}))

export const channelMentionsRelations = relations(channelMentions, ({ one }) => ({
  channel: one(channels, {
    fields: [channelMentions.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [channelMentions.userId],
    references: [users.id],
  }),
}))

// Add types for the new tables
export type Mention = typeof mentions.$inferSelect
export type NewMention = typeof mentions.$inferInsert

export type ChannelMention = typeof channelMentions.$inferSelect
export type NewChannelMention = typeof channelMentions.$inferInsert

// Export query config
export const queryConfig = {
  workspaces,
  users,
  userAuth,
  channels,
  messages,
  workspaceMemberships,
  directMessageChannels,
  directMessageMembers,
  notifications,
  invites,
  unreadMessages,
  mentions,
  channelMentions,
  // Add relations
  workspaceMembershipsRelations,
  workspacesRelations,
  usersRelations,
  userAuthRelations,
  channelsRelations,
  directMessageChannelsRelations,
  directMessageMembersRelations,
  unreadMessagesRelations,
  notificationsRelations,
  messagesRelations,
  invitesRelations,
  mentionsRelations,
  channelMentionsRelations,
} as const 