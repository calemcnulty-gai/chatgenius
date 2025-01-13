import { db } from '@/db'
import { users, workspaceMemberships, workspaces } from '@/db/schema'
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
  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUser.id),
  })

  if (existingUser) {
    return existingUser
  }

  // Create new user
  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) throw new Error('User must have an email address')

  const now = createTimestamp(new Date())
  const id = uuidv4()
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Anonymous'

  // Insert the new user
  const [dbUser] = await db.insert(users)
    .values({
      id,
      clerkId: clerkUser.id,
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
      target: users.clerkId,
      set: {
        name,
        email,
        profileImage: clerkUser.imageUrl,
        updatedAt: now,
      },
    })
    .returning()

  // Get the Gauntlet workspace
  const gauntletWorkspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, 'gauntlet'),
  })

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