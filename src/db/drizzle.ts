import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config()

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const db = drizzle(pool)

  console.log('Running migrations...')
  
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'drizzle'),
  })

  console.log('Migrations completed!')
  
  await pool.end()
}

main().catch((err) => {
  console.error('Error running migrations:', err)
  process.exit(1)
}) 