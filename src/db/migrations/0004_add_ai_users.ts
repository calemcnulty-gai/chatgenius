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
    // Create the user
    const userId = uuidv4()
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
        ${userId},
        ${`ai-${fighter.name.toLowerCase().replace(/\s+/g, '-')}`},
        ${fighter.name},
        ${fighter.email},
        ${fighter.profileImage},
        ${fighter.displayName},
        ${fighter.title},
        'UTC',
        'online'
      )
      ON CONFLICT (clerk_id) DO NOTHING
      RETURNING id;
    `)

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
        ${userId},
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