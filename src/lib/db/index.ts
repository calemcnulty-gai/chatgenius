import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { createTimestampMiddleware } from './middleware'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create base database instance
const baseDb = drizzle(pool)

// Wrap with timestamp middleware
export const db = createTimestampMiddleware(baseDb)

// Export pool for direct access if needed
export { pool } 