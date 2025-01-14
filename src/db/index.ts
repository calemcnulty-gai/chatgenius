import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

let _pool: Pool | null = null
let _db: ReturnType<typeof drizzle> | null = null

// Get or create connection pool
export function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      allowExitOnIdle: false
    })

    // Handle pool errors
    _pool.on('error', (err) => {
      console.error('Unexpected database error:', err)
    })
  }
  return _pool
}

// Get or create database instance
export function getDb() {
  if (!_db) {
    const pool = getPool()
    _db = drizzle(pool, {
      schema,
      logger: process.env.NODE_ENV === 'development' ? {
        logQuery(query: string, params: unknown[]) {
          console.log('SQL Query:', { query, params })
        }
      } : undefined
    })
  }
  return _db
}

// Test the connection with retries
export async function testConnection() {
  const pool = getPool()
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

// Export db for backward compatibility
export const db = process.env.NODE_ENV === 'production' ? getDb() : new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>]
  }
}) 