DO $$
BEGIN
    -- Add unique constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint 
        WHERE conname IN ('unread_messages_user_id_channel_id_key', 'unread_messages_user_id_dm_channel_id_key')
    ) THEN
        ALTER TABLE unread_messages 
        ADD CONSTRAINT unread_messages_user_id_channel_id_key 
        UNIQUE (user_id, channel_id);

        ALTER TABLE unread_messages 
        ADD CONSTRAINT unread_messages_user_id_dm_channel_id_key 
        UNIQUE (user_id, dm_channel_id);
    END IF;
END $$; 