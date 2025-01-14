import { sql } from 'drizzle-orm'
import { db } from '.'
import { up as initialSchema } from './migrations/0001_initial_schema'
import { up as addGauntletWorkspace } from './migrations/0002_add_gauntlet_workspace'
import { up as addGeneralChannels } from './migrations/0003_add_general_channels'
import { up as addAiUsers } from './migrations/0004_add_ai_users'
import { up as addAiTrashTalk } from './migrations/0005_add_ai_trash_talk'

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

    console.log('Starting initial schema migration...')
    try {
      await initialSchema()
      console.log('Initial schema migration completed successfully')
    } catch (err) {
      console.error('Error in initial schema migration:', err)
      throw err
    }

    console.log('Starting Gauntlet workspace migration...')
    try {
      await addGauntletWorkspace()
      console.log('Gauntlet workspace migration completed successfully')
    } catch (err) {
      console.error('Error in Gauntlet workspace migration:', err)
      throw err
    }

    console.log('Starting general channels migration...')
    try {
      await addGeneralChannels()
      console.log('General channels migration completed successfully')
    } catch (err) {
      console.error('Error in general channels migration:', err)
      throw err
    }

    console.log('Starting AI users migration...')
    try {
      await addAiUsers()
      console.log('AI users migration completed successfully')
    } catch (err) {
      console.error('Error in AI users migration:', err)
      throw err
    }

    console.log('Starting AI trash talk migration...')
    try {
      await addAiTrashTalk()
      console.log('AI trash talk migration completed successfully')
    } catch (err) {
      console.error('Error in AI trash talk migration:', err)
      throw err
    }

    console.log('All migrations completed successfully!')
    process.exit(0)
  } catch (err) {
    console.error('Fatal error running migrations:', err)
    process.exit(1)
  }
}

main() 