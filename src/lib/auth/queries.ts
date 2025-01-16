import { db } from '@/db'
import { users, userAuth, workspaceMemberships, workspaces } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { now } from '@/types/timestamp'
import type { DBUser, ClerkWebhookUser, UpdateProfileParams } from './types'

export async function findUserByClerkId(clerkId: string): Promise<DBUser | undefined> {
  const result = await db.query.userAuth.findFirst({
    where: eq(userAuth.clerkId, clerkId),
    with: {
      user: true
    }
  })
  return result?.user
}

export async function createOrUpdateUser(params: {
  clerkId: string
  name: string
  email: string
  profileImage: string | null
}): Promise<DBUser> {
  const timestamp = now()
  
  // First create/update the user
  const [user] = await db
    .insert(users)
    .values({
      id: uuidv4(),
      name: params.name,
      email: params.email,
      profileImage: params.profileImage,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: params.name,
        profileImage: params.profileImage,
        updatedAt: timestamp,
      },
    })
    .returning()

  // Then create/update the auth mapping
  await db
    .insert(userAuth)
    .values({
      id: uuidv4(),
      userId: user.id,
      clerkId: params.clerkId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: userAuth.clerkId,
      set: {
        updatedAt: timestamp,
      },
    })

  return user
}

export async function updateUserProfile(params: UpdateProfileParams): Promise<DBUser> {
  const userAuthRecord = await db.query.userAuth.findFirst({
    where: eq(userAuth.clerkId, params.clerkId),
  })

  if (!userAuthRecord) {
    throw new Error('User not found')
  }

  const [user] = await db
    .update(users)
    .set({
      displayName: params.displayName,
      title: params.title,
      timeZone: params.timeZone,
      updatedAt: now(),
    })
    .where(eq(users.id, userAuthRecord.userId))
    .returning()

  return user
}

export async function addUserToGauntlet(userId: string): Promise<void> {
  // Get or create Gauntlet workspace
  let gauntletWorkspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, 'gauntlet'),
  })

  if (!gauntletWorkspace) {
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        id: '8903c486-7dc5-4d2b-b973-e25ae786f6d7', // Fixed UUID for Gauntlet
        name: 'Gauntlet',
        slug: 'gauntlet',
        ownerId: userId,
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing()
      .returning()

    gauntletWorkspace = newWorkspace
  }

  if (gauntletWorkspace) {
    await db
      .insert(workspaceMemberships)
      .values({
        id: uuidv4(),
        workspaceId: gauntletWorkspace.id,
        userId,
        role: 'member',
        createdAt: now(),
        updatedAt: now(),
      })
      .onConflictDoNothing()
  }
} 