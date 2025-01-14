import { sql } from 'drizzle-orm'
import { db, pool } from '..'
import { v4 as uuidv4 } from 'uuid'
import { createTimestamp } from './utils'

interface AiUser {
    name: string
    displayName: string
    title: string
    profileImage: string
}

const AI_USERS: AiUser[] = [
    {
        name: 'Khabib Nurmagomedov',
        displayName: 'The Eagle',
        title: 'Undefeated Lightweight Champion',
        profileImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Khabib_Nurmagomedov_2019.jpg/800px-Khabib_Nurmagomedov_2019.jpg'
    },
    {
        name: 'Conor McGregor',
        displayName: 'The Notorious',
        title: 'Double Champion',
        profileImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Conor_McGregor_2018.jpg/800px-Conor_McGregor_2018.jpg'
    },
    {
        name: 'Chael Sonnen',
        displayName: 'The American Gangster',
        title: 'Undefeated and Undisputed',
        profileImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Chael_Sonnen.jpg/800px-Chael_Sonnen.jpg'
    },
    {
        name: 'Don Frye',
        displayName: 'The Predator',
        title: 'UFC Hall of Famer',
        profileImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Don_Frye_2009.jpg/800px-Don_Frye_2009.jpg'
    }
]

export async function up(db: any) {
    // Get the Gauntlet workspace ID
    const { rows: [gauntletWorkspace] } = await pool.query<{ id: string }>(`
        SELECT id FROM workspaces WHERE slug = 'gauntlet';
    `)

    // Add each AI user
    for (const user of AI_USERS) {
        // Create unique clerk_id for AI users
        const clerkId = `ai-${user.name.toLowerCase().replace(/\s+/g, '-')}`

        // Insert user
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
                status, 
                created_at, 
                updated_at
            )
            VALUES (
                ${uuidv4()},
                ${clerkId},
                ${user.name},
                ${`${clerkId}@chatgenius.local`},
                ${user.profileImage},
                ${user.displayName},
                ${user.title},
                'UTC',
                'online',
                ${createTimestamp(new Date())},
                ${createTimestamp(new Date())}
            )
            ON CONFLICT (clerk_id) DO NOTHING
            RETURNING id;
        `)

        // Get the user ID
        const { rows: [aiUser] } = await pool.query<{ id: string }>(`
            SELECT id FROM users WHERE clerk_id = $1;
        `, [clerkId])

        // Add user to Gauntlet workspace
        await db.execute(sql`
            INSERT INTO workspace_memberships (
                id,
                workspace_id,
                user_id,
                role,
                created_at,
                updated_at
            )
            VALUES (
                ${uuidv4()},
                ${gauntletWorkspace.id},
                ${aiUser.id},
                'member',
                ${createTimestamp(new Date())},
                ${createTimestamp(new Date())}
            )
            ON CONFLICT (workspace_id, user_id) DO NOTHING;
        `)
    }
}

export async function down(db: any) {
    // Remove AI users and their workspace memberships
    for (const user of AI_USERS) {
        const clerkId = `ai-${user.name.toLowerCase().replace(/\s+/g, '-')}`
        
        // Get user ID
        const { rows: [aiUser] } = await pool.query<{ id: string }>(`
            SELECT id FROM users WHERE clerk_id = $1;
        `, [clerkId])

        if (aiUser) {
            // Remove workspace memberships
            await db.execute(sql`
                DELETE FROM workspace_memberships
                WHERE user_id = ${aiUser.id};
            `)

            // Remove user
            await db.execute(sql`
                DELETE FROM users
                WHERE id = ${aiUser.id};
            `)
        }
    }
} 