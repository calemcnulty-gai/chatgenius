import { sql } from 'drizzle-orm'
import { db, pool } from '.'
import { initialSchema } from './migrations/0001_initial_schema'
import { addIndexes } from './migrations/0002_add_indexes'
import { addSlugs } from './migrations/0004_add_slugs'
import { addGeneralChannels } from './migrations/0003_add_general_channels'
import { addMessages } from './migrations/0005_add_messages'
import { addDirectMessages } from './migrations/0006_add_direct_messages'
import { addNotifications } from './migrations/0007_add_notifications'
import { addUnreadMessages } from './migrations/0008_add_unread_messages'
import { addMessageThreading } from './migrations/0009_add_message_threading'
import { addWorkspaceOwner } from './migrations/0010_add_workspace_owner'
import { addUserEmail } from './migrations/0011_add_user_email'
import { addUserProfiles } from './migrations/0012_add_user_profiles'
import { addStatusHistory } from './migrations/0013_add_status_history'
import { up as addClerkId } from './migrations/0015_add_clerk_id'
import { up as addAiGenerated } from './migrations/0016_add_ai_generated'
import { up as addMessageAttachments } from './migrations/0017_add_message_attachments'
import { up as addMessageThreadingColumns } from './migrations/0018_add_message_threading_columns'
import { addUserProfileFields } from './migrations/0019_add_user_profile_fields'
import { up as addUserTimezone } from './migrations/0020_add_user_timezone'
import { up as addInvitesTable } from './migrations/0021_add_invites_table'
import { addLastHeartbeat } from './migrations/0022_add_last_heartbeat'
import { standardizeAllTimestamps } from './migrations/0024_standardize_all_timestamps'
import { up as addInvites } from './migrations/0025_add_invites'
import { addGauntletWorkspace } from './migrations/0026_add_gauntlet_workspace'
import { up as removeNextAuthColumns } from './migrations/0027_remove_nextauth_columns'
import { up as addAiUsers } from './migrations/0028_add_ai_users'
import { up as addAiTrashTalk } from './migrations/0029_add_ai_trash_talk'

async function main() {
  console.log('Adding initial schema...')
  await initialSchema()

  console.log('Adding indexes...')
  await addIndexes()

  console.log('Adding slugs...')
  await addSlugs()

  console.log('Adding general channels...')
  await addGeneralChannels()

  console.log('Adding messages...')
  await addMessages()

  console.log('Adding direct messages...')
  await addDirectMessages()

  console.log('Adding notifications...')
  await addNotifications()

  console.log('Adding unread messages...')
  await addUnreadMessages()

  console.log('Adding message threading...')
  await addMessageThreading()

  console.log('Adding workspace owner...')
  await addWorkspaceOwner()

  console.log('Adding user email...')
  await addUserEmail()

  console.log('Adding user profiles...')
  await addUserProfiles()

  console.log('Adding status history...')
  await addStatusHistory()

  console.log('Adding clerk ID...')
  await addClerkId(db)

  console.log('Adding AI generated flag...')
  await addAiGenerated(db)

  console.log('Adding message attachments...')
  await addMessageAttachments(db)

  console.log('Adding message threading columns...')
  await addMessageThreadingColumns(db)

  console.log('Adding user profile fields...')
  await addUserProfileFields()

  console.log('Adding user timezone...')
  await addUserTimezone(db)

  console.log('Adding invites table...')
  await addInvitesTable(db)

  console.log('Adding last heartbeat...')
  await addLastHeartbeat()

  console.log('Standardizing all timestamps...')
  await standardizeAllTimestamps()

  console.log('Adding invites...')
  await addInvites(db)

  console.log('Adding Gauntlet workspace...')
  await addGauntletWorkspace()

  console.log('Removing NextAuth columns...')
  await removeNextAuthColumns(db)

  console.log('Adding AI users...')
  await addAiUsers(db)

  console.log('Adding AI trash talk...')
  await addAiTrashTalk()

  console.log('Done!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error running migrations:', err)
  process.exit(1)
}) 