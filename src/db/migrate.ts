import { sql } from 'drizzle-orm'
import { db } from '.'
import { up as initialSchema } from './migrations/0001_initial_schema'
import { up as addGauntletWorkspace } from './migrations/0002_add_gauntlet_workspace'
import { up as addGeneralChannels } from './migrations/0003_add_general_channels'
import { up as addAiUsers } from './migrations/0004_add_ai_users'
import { up as addAiTrashTalk } from './migrations/0005_add_ai_trash_talk'
import { up as addNateDiaz } from './migrations/0006_add_nate_diaz'
import { up as addUnreadMessagesConstraints } from './migrations/0010_add_unread_messages_unique_constraints'
import { up as updateAiProfileImages } from './migrations/0011_update_ai_profile_images'

// List migrations in order with their names
const migrations = [
  { up: initialSchema, name: 'initial schema migration' },
  { up: addGauntletWorkspace, name: 'Gauntlet workspace migration' },
  { up: addGeneralChannels, name: 'general channels migration' },
  { up: addAiUsers, name: 'AI users migration' },
  { up: addAiTrashTalk, name: 'AI trash talk migration' },
  { up: addNateDiaz, name: 'Nate Diaz migration' },
  { up: addUnreadMessagesConstraints, name: 'add unread messages constraints' },
  { up: updateAiProfileImages, name: 'update AI profile images to relative paths' }
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
      console.log(`Starting ${migration.name}...`)
      try {
        await migration.up()
        console.log(`${migration.name} completed successfully`)
      } catch (err) {
        console.error(`Error in ${migration.name}:`, err)
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