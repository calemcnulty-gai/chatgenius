import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Configure connection pool with reasonable defaults
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: false
})

// Create base database instance with query logging
export const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery(query: string, params: unknown[]) {
      console.log('SQL Query:', { query, params })
    }
  } : undefined
})

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err)
})

// Test the connection with retries
const testConnection = async () => {
  let retries = 5
  while (retries > 0) {
    try {
      await pool.query('SELECT NOW()')
      console.log('Database connected successfully')
      break
    } catch (err) {
      retries--
      if (retries === 0) {
        console.error('Failed to connect to database after retries:', err)
        throw err
      }
      console.log(`Database connection failed, retrying... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
}

testConnection().catch(console.error) 