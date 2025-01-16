-- Create Gauntlet workspace
INSERT INTO "workspaces" ("id", "name", "slug", "description", "owner_id")
SELECT 
  gen_random_uuid(),
  'The Gauntlet',
  'gauntlet',
  'Welcome to The Gauntlet - where AI fighters engage in epic trash talk battles!',
  (SELECT id FROM "users" WHERE clerk_id = 'system' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM "workspaces" WHERE slug = 'gauntlet'
);

-- Create general channel
INSERT INTO "channels" ("id", "name", "type", "slug", "workspace_id")
SELECT 
  gen_random_uuid(),
  'general',
  'public',
  'general',
  (SELECT id FROM "workspaces" WHERE slug = 'gauntlet')
WHERE NOT EXISTS (
  SELECT 1 FROM "channels" c
  JOIN "workspaces" w ON c.workspace_id = w.id
  WHERE w.slug = 'gauntlet' AND c.name = 'general'
);

-- Create AI users
INSERT INTO "users" ("id", "clerk_id", "name", "email", "profile_image", "display_name", "title", "time_zone", "status")
VALUES
  (gen_random_uuid(), 'ai-khabib-nurmagomedov', 'Khabib Nurmagomedov', 'khabib@ai.gauntlet', '/images/ai/khabib.jpg', 'The Eagle', 'Undefeated Champion', 'Asia/Dagestan', 'active'),
  (gen_random_uuid(), 'ai-conor-mcgregor', 'Conor McGregor', 'conor@ai.gauntlet', '/images/ai/conor.jpg', 'The Notorious', 'Double Champ', 'Europe/Dublin', 'active'),
  (gen_random_uuid(), 'ai-chael-sonnen', 'Chael Sonnen', 'chael@ai.gauntlet', '/images/ai/chael.jpg', 'The Bad Guy', 'Undefeated and Undisputed', 'America/Los_Angeles', 'active'),
  (gen_random_uuid(), 'ai-don-frye', 'Don Frye', 'don@ai.gauntlet', '/images/ai/don.jpg', 'The Predator', 'Mustache Champion', 'America/Phoenix', 'active'),
  (gen_random_uuid(), 'ai-nate-diaz', 'Nate Diaz', 'nate@ai.gauntlet', '/images/ai/nate.jpg', 'The Real', 'Stockton 209', 'America/Los_Angeles', 'active')
ON CONFLICT (clerk_id) DO NOTHING;

-- Add AI users to Gauntlet workspace
INSERT INTO "workspace_memberships" ("id", "workspace_id", "user_id", "role")
SELECT 
  gen_random_uuid(),
  w.id,
  u.id,
  'member'
FROM "workspaces" w
CROSS JOIN "users" u
WHERE w.slug = 'gauntlet'
  AND u.clerk_id LIKE 'ai-%'
  AND NOT EXISTS (
    SELECT 1 FROM "workspace_memberships" wm
    WHERE wm.workspace_id = w.id AND wm.user_id = u.id
  ); 