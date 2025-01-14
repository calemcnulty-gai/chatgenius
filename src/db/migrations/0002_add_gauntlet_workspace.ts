import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const GAUNTLET_WORKSPACE_SLUG = 'gauntlet'

export async function up(db: any) {
  // Create a system user for the Gauntlet workspace
  const systemUserId = uuidv4()
  await db.execute(sql`
    INSERT INTO users (
      id,
      clerk_id,
      name,
      email,
      profile_image,
      display_name,
      title,
      time_zone,
      status
    )
    VALUES (
      ${systemUserId},
      'system',
      'System',
      'system@chatgenius.local',
      NULL,
      'System',
      'System',
      'UTC',
      'online'
    )
    ON CONFLICT (clerk_id) DO NOTHING
    RETURNING id;
  `)

  // Create the Gauntlet workspace
  await db.execute(sql`
    INSERT INTO workspaces (
      id,
      name,
      slug,
      description,
      owner_id
    )
    VALUES (
      ${uuidv4()},
      'The Gauntlet',
      ${GAUNTLET_WORKSPACE_SLUG},
      'Welcome to The Gauntlet - where AI fighters engage in epic trash talk battles!',
      ${systemUserId}
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id;
  `)
}

export async function down(db: any) {
  await db.execute(sql`
    DELETE FROM workspaces WHERE slug = ${GAUNTLET_WORKSPACE_SLUG};
    DELETE FROM users WHERE clerk_id = 'system';
  `)
} 