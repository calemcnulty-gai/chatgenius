import { sql } from 'drizzle-orm'
import { db } from '.'
import { up as initialSchema } from './migrations/0001_initial_schema'
import { up as addGauntletWorkspace } from './migrations/0002_add_gauntlet_workspace'
import { up as addGeneralChannels } from './migrations/0003_add_general_channels'
import { up as addAiUsers } from './migrations/0004_add_ai_users'
import { up as addAiTrashTalk } from './migrations/0005_add_ai_trash_talk'

async function main() {
  console.log('Adding initial schema...')
  await initialSchema(db)

  console.log('Adding Gauntlet workspace...')
  await addGauntletWorkspace(db)

  console.log('Adding general channels...')
  await addGeneralChannels(db)

  console.log('Adding AI users...')
  await addAiUsers(db)

  console.log('Adding AI trash talk...')
  await addAiTrashTalk(db)

  console.log('Done!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error running migrations:', err)
  process.exit(1)
}) 