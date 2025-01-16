DO $$
DECLARE
    workspace_id uuid;
    user_id uuid;
BEGIN
    -- Get the Gauntlet workspace
    SELECT id INTO workspace_id FROM workspaces WHERE slug = 'gauntlet';

    IF workspace_id IS NULL THEN
        RAISE NOTICE 'Gauntlet workspace not found';
        RETURN;
    END IF;

    -- Create Khabib
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
        'ai-khabib-nurmagomedov',
        'Khabib Nurmagomedov',
        'khabib@chatgenius.local',
        'https://example.com/khabib.jpg',
        'The Eagle',
        'Undefeated Champion',
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

    -- Add Khabib to workspace
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

    -- Create Conor
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
        'ai-conor-mcgregor',
        'Conor McGregor',
        'conor@chatgenius.local',
        'https://example.com/conor.jpg',
        'The Notorious',
        'Double Champ',
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

    -- Add Conor to workspace
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

    -- Create Chael
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
        'ai-chael-sonnen',
        'Chael Sonnen',
        'chael@chatgenius.local',
        'https://example.com/chael.jpg',
        'The American Gangster',
        'Undefeated and Undisputed',
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

    -- Add Chael to workspace
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

    -- Create Don Frye
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
        'ai-don-frye',
        'Don Frye',
        'don@chatgenius.local',
        'https://example.com/don.jpg',
        'The Predator',
        'Ultimate Fighter',
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

    -- Add Don to workspace
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

END $$; 