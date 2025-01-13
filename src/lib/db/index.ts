import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create base database instance with query logging
export const db = drizzle(pool, {
  logger: {
    logQuery(query: string, params: unknown[]) {
      console.log('SQL Query:', { query, params })
    }
  }
})

// Export pool for direct access if needed
export { pool }
