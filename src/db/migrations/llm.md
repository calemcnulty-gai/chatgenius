# Database Migrations

This directory contains all database migrations for ChatGenius, using Drizzle ORM. The migrations are organized into two main categories: schema and data migrations.

## Migration Structure

Each migration file follows the pattern `{number}_{description}.ts` and contains both `up` and `down` migrations for forward and rollback operations. All migrations accept a `db` parameter and use raw SQL for maximum control and clarity.

## Migration Categories

1. **Schema Migration (0001)**
   - Complete database schema in a single migration
   - All tables and their columns
   - All foreign key relationships
   - All indexes for performance
   - Standardized timestamp handling

2. **Data Migrations (0002-0005)**
   - `0002`: Creates the Gauntlet workspace and system user
   - `0003`: Adds general channels to all workspaces
   - `0004`: Creates AI users in the Gauntlet workspace
   - `0005`: Adds initial AI trash talk messages

## Tables

1. **Core Tables**
   - `users`: User accounts and profiles
   - `workspaces`: Workspace containers
   - `workspace_memberships`: User workspace relationships
   - `channels`: Communication channels
   - `messages`: All messages with threading support
   - `direct_messages`: Private messages between users
   - `notifications`: User notifications
   - `unread_messages`: Message read status tracking
   - `status_history`: User status changes
   - `ai_interactions`: AI message history
   - `invites`: Workspace invitations

## Best Practices

1. **Migration Safety**
   - Always include down migrations
   - Test migrations on development first
   - Back up data before running in production
   - Consider data volume impact

2. **Naming Conventions**
   - Use descriptive names
   - Include purpose in filename
   - Keep names consistent
   - Use snake_case for filenames

3. **Data Handling**
   - Handle existing data
   - Provide default values
   - Consider constraints
   - Maintain data integrity

4. **Performance**
   - Consider table size
   - Use batching for large updates
   - Add appropriate indexes
   - Monitor migration duration

## Migration Patterns

1. **Table Creation**
   ```sql
   CREATE TABLE IF NOT EXISTS "table_name" (
     "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
     "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Data Insertion**
   ```sql
   INSERT INTO table_name (column1, column2)
   VALUES ($1, $2)
   ON CONFLICT DO NOTHING;
   ```

3. **Index Creation**
   ```sql
   CREATE INDEX IF NOT EXISTS "index_name" 
   ON "table_name" ("column_name");
   ```

## Running Migrations

Migrations are run in order through the `migrate.ts` script:
1. Initial schema creation
2. Gauntlet workspace setup
3. General channels creation
4. AI users creation
5. Initial message creation 