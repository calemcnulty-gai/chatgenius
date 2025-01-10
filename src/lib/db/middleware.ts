import { type PgDatabase } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { transformDatabaseTimestamps, prepareDatabaseTimestamps } from './transformers'

/**
 * Creates a middleware that transforms timestamps in database operations
 */
export function createTimestampMiddleware(db: PgDatabase<any>) {
  const originalExecute = db.execute.bind(db)

  return {
    ...db,
    execute: async (query: ReturnType<typeof sql>) => {
      const result = await originalExecute(query)
      return transformDatabaseTimestamps(result)
    },
    query: async <T>(query: ReturnType<typeof sql>) => {
      const result = await originalExecute(query)
      return transformDatabaseTimestamps(result) as T
    }
  }
} 