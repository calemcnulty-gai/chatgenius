DO $$
DECLARE
    workspace_record RECORD;
BEGIN
    -- Add a general channel to each workspace
    FOR workspace_record IN SELECT id FROM workspaces
    LOOP
        INSERT INTO channels (
            id,
            workspace_id,
            name,
            slug,
            type,
            created_at,
            updated_at
        )
        VALUES (
            gen_random_uuid(),
            workspace_record.id,
            'general',
            'general',
            'public',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (workspace_id, slug) DO NOTHING;
    END LOOP;
END $$; 