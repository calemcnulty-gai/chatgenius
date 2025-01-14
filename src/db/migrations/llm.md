# Database Migrations

This directory contains all database migrations for ChatGenius, using Drizzle ORM. Migrations are numbered sequentially and represent the evolution of the database schema over time.

## Migration Structure

Each migration file follows the pattern `{number}_{description}.ts` and contains both `up` and `down` migrations for forward and rollback operations.

## Key Migration Categories

1. **Schema Evolution**
   - Initial schema (0001)
   - Adding new tables
   - Adding new columns
   - Modifying existing columns
   - Adding indexes and constraints

2. **Data Standardization**
   - Timestamp standardization (0023, 0024)
   - Timezone conversions (0023)
   - Data cleanup and normalization

3. **Feature Support**
   - Message threading (0009, 0018)
   - User profiles (0012)
   - Notifications (0007)
   - File attachments (0017, 0022)
   - Workspace management (0026)

## Migration Patterns

1. **Table Creation**
   ```typescript
   export async function up(db: PostgresJsDatabase) {
     await db.schema
       .createTable("table_name")
       .addColumn("id", "uuid", c => c.primaryKey().defaultRandom())
       .addColumn("created_at", "timestamp", c => c.defaultNow())
       .execute()
   }
   ```

2. **Column Addition**
   ```typescript
   export async function up(db: PostgresJsDatabase) {
     await db.schema
       .alterTable("table_name")
       .addColumn("new_column", "data_type")
       .execute()
   }
   ```

3. **Index Creation**
   ```typescript
   export async function up(db: PostgresJsDatabase) {
     await db.schema
       .createIndex("index_name")
       .on("table_name")
       .columns(["column_name"])
       .execute()
   }
   ```

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

## Recent Changes

Latest migrations focus on:
- Removing legacy auth columns (0027)
- Adding Gauntlet workspace support (0026)
- Implementing invite system (0025)
- Standardizing timestamps (0024)
- Adding user profile enhancements (0019)

See individual migration files for specific implementation details. 