import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '..'
import * as fs from 'fs'
import * as path from 'path'

// Read and parse the JSON file at startup
const jsonPath = path.join(process.cwd(), 'src', 'db', 'migrations', 'data', 'trash_talk.json')
console.log('Reading JSON file from:', jsonPath)
const trashTalkData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
console.log('Found', trashTalkData.messages.length, 'messages in JSON file')

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

  // Get AI users
  const { rows: users } = await db.execute(sql`
    SELECT id, clerk_id FROM users WHERE clerk_id LIKE 'ai-%';
  `)
  console.log('Found', users.length, 'AI users')
  console.log('AI users:', users.map(u => u.clerk_id).join(', '))

  const userMap = new Map(users.map(u => [u.clerk_id, u.id]))

  // Add all messages from the JSON file
  let insertCount = 0
  let skippedCount = 0
  let seenSenders = new Set()
  
  for (const message of trashTalkData.messages) {
    seenSenders.add(message.sender)
    const senderId = userMap.get(message.sender)
    if (senderId) {
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
          ${senderId},
          ${message.content},
          ${new Date(message.created_at).toISOString()},
          ${new Date(message.created_at).toISOString()}
        );
      `)
      insertCount++
    } else {
      console.log(`No user found for sender: ${message.sender}`)
      skippedCount++
    }
  }

  console.log('Unique senders found in JSON:', Array.from(seenSenders).join(', '))
  console.log(`Migration complete. Inserted ${insertCount} messages, skipped ${skippedCount} messages.`)
}

export async function down() {
  await db.execute(sql`
    DELETE FROM messages 
    WHERE sender_id IN (
      SELECT id FROM users WHERE clerk_id LIKE 'ai-%'
    );
  `)
} 