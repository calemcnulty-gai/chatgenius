import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const GAUNTLET_WORKSPACE_SLUG = 'gauntlet'

const TRASH_TALK_MESSAGES = [
  {
    sender: 'Khabib Nurmagomedov',
    content: 'Send me location. I will smesh your boy.',
    recipient: 'Conor McGregor'
  },
  {
    sender: 'Conor McGregor',
    content: "Who the fook is that guy? You'll do nuttin!",
    recipient: 'Khabib Nurmagomedov'
  },
  {
    sender: 'Chael Sonnen',
    content: "I can't let you get close! I'm the best to ever do it, and I'm undefeated!",
    recipient: 'Don Frye'
  },
  {
    sender: 'Don Frye',
    content: "Son, I've been fighting since you were in diapers. Let me teach you some respect.",
    recipient: 'Chael Sonnen'
  }
]

export async function up(db: any) {
  // Get the Gauntlet workspace ID
  const { rows: [gauntletWorkspace] } = await db.execute(sql`
    SELECT id FROM workspaces WHERE slug = ${GAUNTLET_WORKSPACE_SLUG};
  `)

  if (!gauntletWorkspace) {
    throw new Error('Gauntlet workspace not found')
  }

  // Get the general channel ID
  const { rows: [generalChannel] } = await db.execute(sql`
    SELECT id FROM channels 
    WHERE workspace_id = ${gauntletWorkspace.id} AND slug = 'general';
  `)

  if (!generalChannel) {
    throw new Error('General channel not found')
  }

  // Add trash talk messages
  for (const message of TRASH_TALK_MESSAGES) {
    // Get sender ID
    const { rows: [sender] } = await db.execute(sql`
      SELECT id FROM users 
      WHERE clerk_id = ${`ai-${message.sender.toLowerCase().replace(/\s+/g, '-')}`};
    `)

    if (!sender) {
      console.warn(`Sender ${message.sender} not found`)
      continue
    }

    // Add message
    await db.execute(sql`
      INSERT INTO messages (
        id,
        workspace_id,
        channel_id,
        user_id,
        content,
        ai_generated
      )
      VALUES (
        ${uuidv4()},
        ${gauntletWorkspace.id},
        ${generalChannel.id},
        ${sender.id},
        ${message.content},
        true
      );
    `)
  }
}

export async function down(db: any) {
  // Get the Gauntlet workspace ID
  const { rows: [gauntletWorkspace] } = await db.execute(sql`
    SELECT id FROM workspaces WHERE slug = ${GAUNTLET_WORKSPACE_SLUG};
  `)

  if (gauntletWorkspace) {
    // Delete all AI-generated messages in the Gauntlet workspace
    await db.execute(sql`
      DELETE FROM messages 
      WHERE workspace_id = ${gauntletWorkspace.id} AND ai_generated = true;
    `)
  }
} 