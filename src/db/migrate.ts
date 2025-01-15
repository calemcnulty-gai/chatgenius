import { sql } from 'drizzle-orm'
import { db } from '.'
import * as initialSchema from './migrations/0001_initial_schema'
import * as addGauntletWorkspace from './migrations/0002_add_gauntlet_workspace'
import * as addGeneralChannels from './migrations/0003_add_general_channels'
import * as addAiUsers from './migrations/0004_add_ai_users'
import * as addAiTrashTalk from './migrations/0005_add_ai_trash_talk'
import * as addNateDiaz from './migrations/0006_add_nate_diaz'

// List migrations in order
const migrations = [
  initialSchema,
  addGauntletWorkspace,
  addGeneralChannels,
  addAiUsers,
  addAiTrashTalk,
  addNateDiaz
]

async function main() {
  try {
    console.log('Starting migration process...')
    console.log('Testing database connection...')
    
    // Test connection with retries
    let connected = false
    for (let i = 0; i < 5; i++) {
      try {
        await db.execute(sql`SELECT NOW()`)
        connected = true
        console.log('Database connected successfully')
        break
      } catch (err) {
        console.log(`Connection attempt ${i + 1} failed:`, err)
        if (i < 4) {
          console.log('Retrying in 2 seconds...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
    }
    
    if (!connected) {
      throw new Error('Failed to connect to database after 5 attempts')
    }

    // Run all migrations in sequence
    for (const migration of migrations) {
      const name = migration.name || 'Unknown migration'
      console.log(`Starting ${name}...`)
      try {
        await migration.up()
        console.log(`${name} completed successfully`)
      } catch (err) {
        console.error(`Error in ${name}:`, err)
        throw err
      }
    }

    console.log('All migrations completed successfully!')
    process.exit(0)
  } catch (err) {
    console.error('Fatal error running migrations:', err)
    process.exit(1)
  }
}

main() 