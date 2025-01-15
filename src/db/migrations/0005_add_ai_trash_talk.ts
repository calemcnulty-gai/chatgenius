import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '..'
import trashTalkData from './data/trash_talk.json'

export async function up() {
  // Get the Gauntlet workspace
  const { rows: [workspace] } = await db.execute(sql`
    SELECT id FROM workspaces WHERE slug = 'gauntlet';
  `)

  if (!workspace) {
    console.log('Gauntlet workspace not found')
    return
  }

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

  // Get AI users
  const { rows: users } = await db.execute(sql`
    SELECT id, clerk_id FROM users WHERE clerk_id LIKE 'ai-%';
  `)

  const userMap = new Map(users.map(u => [u.clerk_id, u.id]))

  // Add all messages from the JSON file
  for (const message of trashTalkData.messages) {
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
    }
  }
}

export async function down() {
  await db.execute(sql`
    DELETE FROM messages 
    WHERE sender_id IN (
      SELECT id FROM users WHERE clerk_id LIKE 'ai-%'
    );
  `)
} 