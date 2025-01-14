import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { initialSchema } from './migrations/0001_initial_schema'
import { addIndexes } from './migrations/0002_add_indexes'
import { addGeneralChannels } from './migrations/0003_add_general_channels'
import { addSlugs } from './migrations/0004_add_slugs'
import { addMessages } from './migrations/0005_add_messages'
import { addDirectMessages } from './migrations/0006_add_direct_messages'
import { addNotifications } from './migrations/0007_add_notifications'
import { addUnreadMessages } from './migrations/0008_add_unread_messages'
import { addUserProfiles } from './migrations/0012_add_user_profiles'
import { addStatusHistory } from './migrations/0013_add_status_history'
import { up as addClerkId } from './migrations/0015_add_clerk_id'
import { up as addMessageAttachments } from './migrations/0017_add_message_attachments'
import { up as addMessageThreadingColumns } from './migrations/0018_add_message_threading_columns'
import { addLastHeartbeat } from './migrations/0022_add_last_heartbeat'
import { standardizeAllTimestamps } from './migrations/0024_standardize_all_timestamps'
import { up as addInvites } from './migrations/0025_add_invites'
import { addGauntletWorkspace } from './migrations/0026_add_gauntlet_workspace'
import { up as addAiUsers } from './migrations/0028_add_ai_users'
import { up as addAiTrashTalk } from './migrations/0029_add_ai_trash_talk'
import * as dotenv from 'dotenv'
import { db, pool } from '.'
import { sql } from 'drizzle-orm'

// Load environment variables before anything else
dotenv.config()

async function createDatabaseIfNotExists() {
  // For database creation, we need a temporary connection to postgres database
  const tempPool = new Pool({
    connectionString: process.env.DATABASE_URL?.replace('/chatgenius', '/postgres'),
  })

  try {
    const result = await tempPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'chatgenius'"
    )

    if (result.rows.length === 0) {
      console.log('Creating database...')
      await tempPool.query('CREATE DATABASE chatgenius')
      console.log('Database created successfully')
    } else {
      console.log('Database already exists')
    }
  } finally {
    await tempPool.end()
  }
}

async function main() {
  try {
    console.log('Creating database if it does not exist...')
    await createDatabaseIfNotExists()

    console.log('Creating initial schema...')
    await initialSchema()

    console.log('Adding indexes...')
    await addIndexes()

    console.log('Adding general channels...')
    await addGeneralChannels()

    console.log('Adding slugs...')
    await addSlugs()

    console.log('Adding messages...')
    await addMessages()

    console.log('Adding direct messages...')
    await addDirectMessages()

    console.log('Adding notifications...')
    await addNotifications()

    console.log('Adding unread messages...')
    await addUnreadMessages()

    console.log('Adding user profiles...')
    await addUserProfiles()

    console.log('Adding status history...')
    await addStatusHistory()

    console.log('Adding clerk ID...')
    await addClerkId()

    console.log('Adding message attachments...')
    await pool.query(addMessageAttachments)

    console.log('Adding message threading columns...')
    await pool.query(addMessageThreadingColumns)

    console.log('Adding last heartbeat column...')
    await addLastHeartbeat()

    console.log('Standardizing timestamps...')
    await standardizeAllTimestamps()

    console.log('Adding invites table...')
    await addInvites()

    console.log('Adding Gauntlet workspace...')
    await addGauntletWorkspace()

    console.log('Adding AI users...')
    await addAiUsers(db)

    console.log('Adding AI trash talk...')
    await addAiTrashTalk()

    console.log('All migrations completed successfully')
  } catch (error) {
    console.error('Error running migrations:', error)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Error performing migrations:', err)
  process.exit(1)
}) 