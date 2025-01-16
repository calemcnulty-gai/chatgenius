import { sql } from 'drizzle-orm'
import { db } from '@/db'

export const up = async () => {
  try {
    // Check if constraints exist
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM pg_constraint 
      WHERE conname IN ('unread_messages_user_id_channel_id_key', 'unread_messages_user_id_dm_channel_id_key')
    `)
    
    const count = result.rows[0]?.count
    const constraintsExist = typeof count === 'number' ? count > 0 : false
    
    if (!constraintsExist) {
      await db.execute(sql`
        ALTER TABLE unread_messages 
        ADD CONSTRAINT unread_messages_user_id_channel_id_key 
        UNIQUE (user_id, channel_id);

        ALTER TABLE unread_messages 
        ADD CONSTRAINT unread_messages_user_id_dm_channel_id_key 
        UNIQUE (user_id, dm_channel_id);
      `)
    }
  } catch (error) {
    console.log('Constraints may already exist, continuing...')
  }
}

export const down = async () => {
  try {
    await db.execute(sql`
      ALTER TABLE unread_messages 
      DROP CONSTRAINT IF EXISTS unread_messages_user_id_channel_id_key;

      ALTER TABLE unread_messages 
      DROP CONSTRAINT IF EXISTS unread_messages_user_id_dm_channel_id_key;
    `)
  } catch (error) {
    console.log('Error dropping constraints:', error)
  }
} 