DO $$
DECLARE
    workspace_id uuid;
    channel_id uuid;
    user_id uuid;
BEGIN
    -- Get the Gauntlet workspace
    SELECT id INTO workspace_id FROM workspaces WHERE slug = 'gauntlet';

    IF workspace_id IS NULL THEN
        RAISE NOTICE 'Gauntlet workspace not found';
        RETURN;
    END IF;

    -- Create Nate Diaz AI user
    INSERT INTO users (
        id,
        clerk_id,
        name,
        email,
        profile_image,
        display_name,
        title,
        time_zone,
        status,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'ai-nate-diaz',
        'Nate Diaz',
        'nate@chatgenius.local',
        'https://example.com/nate.jpg',
        'The Stockton Soldier',
        'West Coast Warrior',
        'UTC',
        'online',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (clerk_id) 
    DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        profile_image = EXCLUDED.profile_image,
        display_name = EXCLUDED.display_name,
        title = EXCLUDED.title
    RETURNING id INTO user_id;

    -- Add Nate to workspace
    INSERT INTO workspace_memberships (
        id,
        workspace_id,
        user_id,
        role,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        workspace_id,
        user_id,
        'member',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- Get the general channel
    SELECT id INTO channel_id 
    FROM channels 
    WHERE workspace_id = workspace_id 
    AND name = 'general';

    IF channel_id IS NULL THEN
        RAISE NOTICE 'General channel not found';
        RETURN;
    END IF;

    -- Add messages from diaz_talk.json
    FOR message_data IN 
        SELECT json_array_elements(messages::json)
        FROM (
            SELECT convert_from(pg_read_binary_file('drizzle/data/diaz_talk.json'), 'UTF8') as messages
        ) as json_data
    LOOP
        IF (message_data->>'sender')::text = 'ai-nate-diaz' THEN
            INSERT INTO messages (
                id,
                channel_id,
                sender_id,
                content,
                created_at,
                updated_at
            )
            VALUES (
                gen_random_uuid(),
                channel_id,
                user_id,
                (message_data->>'content')::text,
                (message_data->>'created_at')::timestamp with time zone,
                (message_data->>'created_at')::timestamp with time zone
            );
        END IF;
    END LOOP;

END $$; 