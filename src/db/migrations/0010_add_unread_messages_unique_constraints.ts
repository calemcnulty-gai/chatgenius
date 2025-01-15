import { sql } from 'drizzle-orm'
import { db } from '../index'

export async function up() {
  await db.execute(sql`
    ALTER TABLE unread_messages 
    ADD CONSTRAINT unread_messages_user_id_channel_id_key 
    UNIQUE (user_id, channel_id);

    ALTER TABLE unread_messages 
    ADD CONSTRAINT unread_messages_user_id_dm_channel_id_key 
    UNIQUE (user_id, dm_channel_id);
  `)
} 