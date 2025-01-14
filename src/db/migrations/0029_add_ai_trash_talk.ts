import { sql } from 'drizzle-orm'
import { db, pool } from '..'
import { v4 as uuidv4 } from 'uuid'
import { createTimestamp } from './utils'

// Import the messages from the JSON file
import trashTalk from './data/trash_talk.json'

const GAUNTLET_WORKSPACE_SLUG = 'gauntlet'
const GENERAL_CHANNEL_SLUG = 'general'

export async function up() {
    // Get the Gauntlet workspace ID
    const { rows: [gauntletWorkspace] } = await pool.query<{ id: string }>(`
        SELECT id FROM workspaces WHERE slug = $1;
    `, [GAUNTLET_WORKSPACE_SLUG])

    if (!gauntletWorkspace) {
        throw new Error('Gauntlet workspace not found')
    }

    // Get the general channel ID
    const { rows: [generalChannel] } = await pool.query<{ id: string }>(`
        SELECT id FROM channels 
        WHERE workspace_id = $1 AND slug = $2;
    `, [gauntletWorkspace.id, GENERAL_CHANNEL_SLUG])

    if (!generalChannel) {
        throw new Error('General channel not found in Gauntlet workspace')
    }

    // Create a map to store user IDs
    const userIds = new Map<string, string>()

    // Get all AI user IDs
    const { rows: aiUsers } = await pool.query<{ clerk_id: string, id: string }>(`
        SELECT clerk_id, id FROM users 
        WHERE clerk_id LIKE 'ai-%';
    `)

    // Store user IDs in the map
    for (const user of aiUsers) {
        userIds.set(user.clerk_id, user.id)
    }

    // Insert messages in batches
    const batchSize = 50
    for (let i = 0; i < trashTalk.messages.length; i += batchSize) {
        const batch = trashTalk.messages.slice(i, i + batchSize)
        
        // Execute for each message
        for (const message of batch) {
            await pool.query(`
                INSERT INTO messages (id, channel_id, sender_id, content, created_at)
                VALUES ($1, $2, $3, $4, $5);
            `, [
                uuidv4(),
                generalChannel.id,
                userIds.get(message.sender),
                message.content,
                message.created_at
            ])
        }
    }
}

export async function down() {
    // Get the Gauntlet workspace ID
    const { rows: [gauntletWorkspace] } = await pool.query<{ id: string }>(`
        SELECT id FROM workspaces WHERE slug = $1;
    `, [GAUNTLET_WORKSPACE_SLUG])

    if (!gauntletWorkspace) {
        return // Nothing to clean up
    }

    // Get the general channel
    const { rows: [generalChannel] } = await pool.query<{ id: string }>(`
        SELECT id FROM channels 
        WHERE workspace_id = $1 AND slug = $2;
    `, [gauntletWorkspace.id, GENERAL_CHANNEL_SLUG])

    if (!generalChannel) {
        return // Nothing to clean up
    }

    // Delete all messages from AI users in the general channel
    await pool.query(`
        DELETE FROM messages
        WHERE channel_id = $1
        AND sender_id IN (
            SELECT id FROM users WHERE clerk_id LIKE 'ai-%'
        );
    `, [generalChannel.id])
} 