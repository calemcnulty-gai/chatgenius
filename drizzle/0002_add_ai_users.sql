DO $$
DECLARE
    gauntlet_workspace_id uuid;
    ai_user_id uuid;
BEGIN
    -- Get the Gauntlet workspace ID
    SELECT id INTO gauntlet_workspace_id FROM workspaces WHERE slug = 'gauntlet';

    -- Create AI Users
    -- Khabib
    INSERT INTO users (
        id,
        name,
        email,
        profile_image,
        display_name,
        title,
        time_zone,
        status,
        is_ai,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'Khabib Nurmagomedov',
        'khabib@chatgenius.local',
        '/khabib.jpg',
        'The Eagle',
        'Undefeated Champion',
        'Asia/Dagestan',
        'online',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        profile_image = EXCLUDED.profile_image,
        display_name = EXCLUDED.display_name,
        title = EXCLUDED.title,
        is_ai = EXCLUDED.is_ai
    RETURNING id INTO ai_user_id;

    INSERT INTO user_auth (id, user_id, clerk_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        ai_user_id,
        'ai-khabib-nurmagomedov',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (clerk_id) DO NOTHING;

    INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        gauntlet_workspace_id,
        ai_user_id,
        'member',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- Conor
    INSERT INTO users (
        id,
        name,
        email,
        profile_image,
        display_name,
        title,
        time_zone,
        status,
        is_ai,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'Conor McGregor',
        'conor@chatgenius.local',
        '/conor.jpg',
        'The Notorious',
        'Double Champ',
        'Europe/Dublin',
        'online',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        profile_image = EXCLUDED.profile_image,
        display_name = EXCLUDED.display_name,
        title = EXCLUDED.title,
        is_ai = EXCLUDED.is_ai
    RETURNING id INTO ai_user_id;

    INSERT INTO user_auth (id, user_id, clerk_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        ai_user_id,
        'ai-conor-mcgregor',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (clerk_id) DO NOTHING;

    INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        gauntlet_workspace_id,
        ai_user_id,
        'member',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- Chael
    INSERT INTO users (
        id,
        name,
        email,
        profile_image,
        display_name,
        title,
        time_zone,
        status,
        is_ai,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'Chael Sonnen',
        'chael@chatgenius.local',
        '/chael.jpg',
        'The Bad Guy',
        'Undefeated and Undisputed',
        'America/Los_Angeles',
        'online',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        profile_image = EXCLUDED.profile_image,
        display_name = EXCLUDED.display_name,
        title = EXCLUDED.title,
        is_ai = EXCLUDED.is_ai
    RETURNING id INTO ai_user_id;

    INSERT INTO user_auth (id, user_id, clerk_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        ai_user_id,
        'ai-chael-sonnen',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (clerk_id) DO NOTHING;

    INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        gauntlet_workspace_id,
        ai_user_id,
        'member',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- Don Frye
    INSERT INTO users (
        id,
        name,
        email,
        profile_image,
        display_name,
        title,
        time_zone,
        status,
        is_ai,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'Don Frye',
        'don@chatgenius.local',
        '/don.jpg',
        'The Predator',
        'Mustache Champion',
        'America/Phoenix',
        'online',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        profile_image = EXCLUDED.profile_image,
        display_name = EXCLUDED.display_name,
        title = EXCLUDED.title,
        is_ai = EXCLUDED.is_ai
    RETURNING id INTO ai_user_id;

    INSERT INTO user_auth (id, user_id, clerk_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        ai_user_id,
        'ai-don-frye',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (clerk_id) DO NOTHING;

    INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        gauntlet_workspace_id,
        ai_user_id,
        'member',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

    -- Nate Diaz
    INSERT INTO users (
        id,
        name,
        email,
        profile_image,
        display_name,
        title,
        time_zone,
        status,
        is_ai,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        'Nate Diaz',
        'nate@chatgenius.local',
        '/nate.jpg',
        'The Real',
        'Stockton 209',
        'America/Los_Angeles',
        'online',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        profile_image = EXCLUDED.profile_image,
        display_name = EXCLUDED.display_name,
        title = EXCLUDED.title,
        is_ai = EXCLUDED.is_ai
    RETURNING id INTO ai_user_id;

    INSERT INTO user_auth (id, user_id, clerk_id, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        ai_user_id,
        'ai-nate-diaz',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (clerk_id) DO NOTHING;

    INSERT INTO workspace_memberships (id, workspace_id, user_id, role, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        gauntlet_workspace_id,
        ai_user_id,
        'member',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (workspace_id, user_id) DO NOTHING;

END $$; 