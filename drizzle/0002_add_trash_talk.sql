DO $$
DECLARE
    channel_id uuid;
    message_data json;
    sender_id uuid;
BEGIN
    -- Get the general channel ID from the Gauntlet workspace
    SELECT c.id INTO channel_id
    FROM channels c
    JOIN workspaces w ON c.workspace_id = w.id
    WHERE w.slug = 'gauntlet' AND c.name = 'general';

    -- Load message data from the JSON file
    FOR message_data IN 
        SELECT json_array_elements(messages::json)
        FROM (
            SELECT convert_from(pg_read_binary_file('drizzle/data/trash_talk.json'), 'UTF8') as messages
        ) as json_data
    LOOP
        -- Get the sender ID
        SELECT id INTO sender_id
        FROM users
        WHERE clerk_id = (message_data->>'sender')::text;

        -- Insert the message if we found the sender
        IF sender_id IS NOT NULL THEN
            INSERT INTO messages (
                id,
                channel_id,
                sender_id,
                content,
                created_at,
                updated_at
            )
            SELECT
                gen_random_uuid(),
                channel_id,
                sender_id,
                (message_data->>'content')::text,
                (message_data->>'created_at')::timestamp with time zone,
                (message_data->>'created_at')::timestamp with time zone
            WHERE NOT EXISTS (
                SELECT 1 FROM messages m
                WHERE m.channel_id = channel_id
                    AND m.sender_id = sender_id
                    AND m.content = (message_data->>'content')::text
            );
        END IF;
    END LOOP;
END $$; 