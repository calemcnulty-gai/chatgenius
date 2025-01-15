import { sql } from 'drizzle-orm'
import { db } from '../index'

export async function up() {
  await db.execute(sql`
    CREATE UNIQUE INDEX unread_messages_user_id_channel_id_key 
    ON unread_messages (user_id, channel_id) 
    WHERE channel_id IS NOT NULL;
    
    CREATE UNIQUE INDEX unread_messages_user_id_dm_channel_id_key 
    ON unread_messages (user_id, dm_channel_id) 
    WHERE dm_channel_id IS NOT NULL;
  `)
} 