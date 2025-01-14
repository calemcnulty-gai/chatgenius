import { sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '..'

export async function up() {
  // Get the Gauntlet workspace
  const { rows: [workspace] } = await db.execute(sql`
    SELECT id FROM workspaces WHERE slug = 'gauntlet';
  `)

  if (!workspace) {
    console.log('Gauntlet workspace not found')
    return
  }

  // Create AI users
  const fighters = [
    {
      name: 'Conor McGregor',
      email: 'conor@chatgenius.local',
      displayName: 'The Notorious',
      title: 'Double Champ',
      profileImage: 'https://example.com/conor.jpg'
    },
    {
      name: 'Chael Sonnen',
      email: 'chael@chatgenius.local',
      displayName: 'The American Gangster',
      title: 'Undefeated and Undisputed',
      profileImage: 'https://example.com/chael.jpg'
    },
    {
      name: 'Don Frye',
      email: 'don@chatgenius.local',
      displayName: 'The Predator',
      title: 'Ultimate Fighter',
      profileImage: 'https://example.com/don.jpg'
    }
  ]

  for (const fighter of fighters) {
    // Create or get the user
    const { rows: [user] } = await db.execute(sql`
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
        ${uuidv4()},
        ${`ai-${fighter.name.toLowerCase().replace(/\s+/g, '-')}`},
        ${fighter.name},
        ${fighter.email},
        ${fighter.profileImage},
        ${fighter.displayName},
        ${fighter.title},
        'UTC',
        'online'
      )
      ON CONFLICT (clerk_id) 
      DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        profile_image = EXCLUDED.profile_image,
        display_name = EXCLUDED.display_name,
        title = EXCLUDED.title
      RETURNING id;
    `)

    if (!user) {
      console.log(`Failed to create or get user ${fighter.name}`)
      continue
    }

    // Add user to workspace
    await db.execute(sql`
      INSERT INTO workspace_memberships (
        id,
        workspace_id,
        user_id,
        role
      )
      VALUES (
        ${uuidv4()},
        ${workspace.id},
        ${user.id},
        'member'
      )
      ON CONFLICT (workspace_id, user_id) DO NOTHING;
    `)
  }
}

export async function down() {
  await db.execute(sql`
    DELETE FROM users WHERE clerk_id LIKE 'ai-%';
  `)
}