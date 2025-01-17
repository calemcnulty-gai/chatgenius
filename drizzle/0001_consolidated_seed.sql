DO $$
DECLARE
    system_user_id uuid;
    gauntlet_workspace_id uuid;
BEGIN
    -- Create system user
    INSERT INTO users (
        id,
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
        'System',
        'system@chatgenius.local',
        NULL,
        'System',
        'System',
        'UTC',
        'online',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) 
    DO UPDATE SET
        name = EXCLUDED.name,
        profile_image = EXCLUDED.profile_image,
        display_name = EXCLUDED.display_name,
        title = EXCLUDED.title
    RETURNING id INTO system_user_id;

    -- Create system user auth
    INSERT INTO user_auth (
        id,
        user_id,
        clerk_id,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        system_user_id,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (clerk_id) DO NOTHING;

    -- Create Gauntlet workspace
    INSERT INTO workspaces (
        id,
        name,
        slug,
        description,
        owner_id,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'The Gauntlet',
        'gauntlet',
        'Welcome to The Gauntlet - where AI fighters engage in epic trash talk battles!',
        system_user_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (slug) 
    DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO gauntlet_workspace_id;

    -- Create general channel
    INSERT INTO channels (
        id,
        name,
        type,
        slug,
        workspace_id,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'general',
        'public',
        'general',
        gauntlet_workspace_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (workspace_id, slug) DO NOTHING;

    -- Add system user to workspace
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
        gauntlet_workspace_id,
        system_user_id,
        'owner',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

END $$; 