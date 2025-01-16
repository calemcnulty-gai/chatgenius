import { db } from '@/db'
import { users, userAuth, workspaces, workspaceMemberships } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { createTimestamp } from '@/types/timestamp'

export async function getOrCreateUser(clerkUser: {
  id: string
  firstName: string | null
  lastName: string | null
  emailAddresses: { emailAddress: string }[]
  imageUrl: string
}) {
  // Check if user exists via auth table
  const existingAuth = await db.query.userAuth.findFirst({
    where: eq(userAuth.clerkId, clerkUser.id),
    with: {
      user: true
    }
  })

  if (existingAuth?.user) {
    return existingAuth.user
  }

  // Create new user
  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) throw new Error('User must have an email address')

  const now = createTimestamp(new Date())
  const userId = uuidv4()
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Anonymous'

  // Insert the new user
  const [dbUser] = await db.insert(users)
    .values({
      id: userId,
      name,
      email,
      profileImage: clerkUser.imageUrl,
      displayName: null,
      title: null,
      timeZone: 'UTC',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name,
        profileImage: clerkUser.imageUrl,
        updatedAt: now,
      },
    })
    .returning()

  // Create auth mapping
  await db.insert(userAuth)
    .values({
      id: uuidv4(),
      userId: dbUser.id,
      clerkId: clerkUser.id,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userAuth.clerkId,
      set: {
        updatedAt: now,
      },
    })

  // Get the Gauntlet workspace
  let gauntletWorkspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, 'gauntlet'),
  })

  if (!gauntletWorkspace) {
    // Create the Gauntlet workspace if it doesn't exist
    const [newWorkspace] = await db.insert(workspaces)
      .values({
        id: '8903c486-7dc5-4d2b-b973-e25ae786f6d7', // Fixed UUID for Gauntlet workspace
        name: 'Gauntlet',
        slug: 'gauntlet',
        ownerId: dbUser.id,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning()
    
    gauntletWorkspace = newWorkspace
  }

  if (gauntletWorkspace) {
    // Add user to the Gauntlet workspace
    await db.insert(workspaceMemberships)
      .values({
        id: uuidv4(),
        workspaceId: gauntletWorkspace.id,
        userId: dbUser.id,
        role: 'member',
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({
        target: [workspaceMemberships.workspaceId, workspaceMemberships.userId],
      })
  }

  return dbUser
} 