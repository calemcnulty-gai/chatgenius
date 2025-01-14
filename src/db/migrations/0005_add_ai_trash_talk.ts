import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '..'

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
    SELECT id, name FROM users WHERE clerk_id LIKE 'ai-%';
  `)

  // Add some initial trash talk
  const messages = [
    {
      sender: 'Conor McGregor',
      content: "I'd like to take this chance to apologize... to absolutely nobody! The double champ does what the fook he wants!"
    },
    {
      sender: 'Chael Sonnen',
      content: "I can't let you get close... to my undefeated and undisputed status. When you're the best fighter in the world, they got a name for you. They don't call you a great fighter, they call you Chael Sonnen."
    },
    {
      sender: 'Don Frye',
      content: "You think you're tough? I fought in the days when we didn't have rules, weight classes, or common sense. Now that's what I call a real predator!"
    }
  ]

  for (const message of messages) {
    const sender = users.find(u => u.name === message.sender)
    if (sender) {
      await db.execute(sql`
        INSERT INTO messages (
          id,
          channel_id,
          sender_id,
          content,
          created_at
        )
        VALUES (
          ${uuidv4()},
          ${channel.id},
          ${sender.id},
          ${message.content},
          CURRENT_TIMESTAMP
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