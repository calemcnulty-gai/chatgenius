### Database Layer Documentation

The `db/` directory contains the database schema, migrations, and query utilities for ChatGenius. We use Drizzle ORM with PostgreSQL for type-safe database operations.

#### Directory Structure

```
db/
├── migrations/   # Database migration files
├── schema.ts    # Database schema and table definitions
├── index.ts     # Database connection and configuration
└── migrate.ts   # Migration utilities
```

#### Database Schema

The database is organized around these core entities:

1. **Users**
   - Core user information
   - Links to Clerk authentication
   - Profile and status tracking

2. **Workspaces**
   - Container for channels and members
   - Owned by a user
   - Unique slugs for routing

3. **Channels**
   - Communication spaces within workspaces
   - Support for public/private types
   - Slug-based routing

4. **Messages**
   - Channel and DM messages
   - Support for attachments
   - Tracking read/unread status

5. **Direct Messages**
   - Private conversations between users
   - Separate from channel messages

#### Key Concepts

1. **Schema Design**
   - Uses Drizzle ORM for type-safe queries
   - UUID primary keys
   - Timestamp tracking (created_at, updated_at)
   - Foreign key relationships

2. **Migrations**
   - Version controlled schema changes
   - Forward and reverse migrations
   - Safe database evolution

3. **Query Patterns**
   - Type-safe query building
   - Relationship handling
   - Performance optimization

#### Usage Guidelines

1. Always use the provided query utilities
2. Maintain referential integrity
3. Include created_at/updated_at timestamps
4. Use migrations for schema changes
5. Keep complex queries in dedicated functions

#### Common Operations

```typescript
// Example: Creating a new workspace
const workspace = await db.insert(workspaces).values({
  name: "New Workspace",
  slug: "new-workspace",
  ownerId: userId
}).returning();

// Example: Getting channels for a workspace
const channels = await db.query.channels.findMany({
  where: eq(channels.workspaceId, workspaceId)
});
```

See the schema.ts file for detailed table definitions and relationships. 