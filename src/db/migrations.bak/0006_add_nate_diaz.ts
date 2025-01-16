import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '..'
import * as fs from 'fs'
import * as path from 'path'

// Read and parse the JSON file at startup
const jsonPath = path.join(process.cwd(), 'src', 'db', 'migrations', 'data', 'diaz_talk.json')
console.log('Reading JSON file from:', jsonPath)
const diazTalkData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
console.log('Found', diazTalkData.messages.length, 'messages in JSON file')

export async function up() {
  // Get the Gauntlet workspace
  const { rows: [workspace] } = await db.execute(sql`
    SELECT id FROM workspaces WHERE slug = 'gauntlet';
  `)

  if (!workspace) {
    console.log('Gauntlet workspace not found')
    return
  }
  console.log('Found workspace:', workspace.id)

  // Create Nate Diaz AI user
  const { rows: [diaz] } = await db.execute(sql`
    INSERT INTO users (
      id,
      clerk_id,
      name,
      email,
      profile_image,
      display_name,
      title,
      time_zone,
      status
    )
    VALUES (
      ${uuidv4()},
      'ai-nate-diaz',
      'Nate Diaz',
      'nate@chatgenius.local',
      'https://example.com/nate.jpg',
      'The Stockton Soldier',
      'West Coast Warrior',
      'UTC',
      'online'
    )
    ON CONFLICT (clerk_id) 
    DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      profile_image = EXCLUDED.profile_image,
      display_name = EXCLUDED.display_name,
      title = EXCLUDED.title
    RETURNING id;
  `)

  if (!diaz) {
    console.log('Failed to create or get Nate Diaz user')
    return
  }

  // Add Nate to workspace
  await db.execute(sql`
    INSERT INTO workspace_memberships (
      id,
      workspace_id,
      user_id,
      role
    )
    VALUES (
      ${uuidv4()},
      ${workspace.id},
      ${diaz.id},
      'member'
    )
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
  `)

  // Get the general channel
  const { rows: [channel] } = await db.execute(sql`
    SELECT id FROM channels 
    WHERE workspace_id = ${workspace.id} 
    AND name = 'general';
  `)

  if (!channel) {
    console.log('General channel not found')
    return
  }
  console.log('Found channel:', channel.id)

  // Add all messages from the JSON file
  let insertCount = 0
  let skippedCount = 0
  
  for (const message of diazTalkData.messages) {
    if (message.sender === 'ai-nate-diaz') {
      await db.execute(sql`
        INSERT INTO messages (
          id,
          channel_id,
          sender_id,
          content,
          created_at,
          updated_at
        )
        VALUES (
          ${uuidv4()},
          ${channel.id},
          ${diaz.id},
          ${message.content},
          ${new Date(message.created_at).toISOString()},
          ${new Date(message.created_at).toISOString()}
        );
      `)
      insertCount++
    } else {
      console.log(`Skipping message from non-Diaz sender: ${message.sender}`)
      skippedCount++
    }
  }

  console.log(`Migration complete. Inserted ${insertCount} messages, skipped ${skippedCount} messages.`)
}

export async function down() {
  // Delete Nate's messages
  await db.execute(sql`
    DELETE FROM messages 
    WHERE sender_id IN (
      SELECT id FROM users WHERE clerk_id = 'ai-nate-diaz'
    );
  `)

  // Delete Nate from workspaces
  await db.execute(sql`
    DELETE FROM workspace_memberships 
    WHERE user_id IN (
      SELECT id FROM users WHERE clerk_id = 'ai-nate-diaz'
    );
  `)

  // Delete Nate
  await db.execute(sql`
    DELETE FROM users WHERE clerk_id = 'ai-nate-diaz';
  `)
} 