import { db } from '@/db'
import { users, workspaceMemberships, workspaces } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { now } from '@/types/timestamp'
import type { DBUser, ClerkWebhookUser, UpdateProfileParams } from './types'

export async function findUserByClerkId(clerkId: string): Promise<DBUser | undefined> {
  return await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  })
}

export async function createOrUpdateUser(params: {
  clerkId: string
  name: string
  email: string
  profileImage: string | null
}): Promise<DBUser> {
  const timestamp = now()
  const [user] = await db
    .insert(users)
    .values({
      id: uuidv4(),
      clerkId: params.clerkId,
      name: params.name,
      email: params.email,
      profileImage: params.profileImage,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        name: params.name,
        email: params.email,
        profileImage: params.profileImage,
        updatedAt: timestamp,
      },
    })
    .returning()

  return user
}

export async function updateUserProfile(params: UpdateProfileParams): Promise<DBUser> {
  const [user] = await db
    .update(users)
    .set({
      displayName: params.displayName,
      title: params.title,
      timeZone: params.timeZone,
      updatedAt: now(),
    })
    .where(eq(users.clerkId, params.clerkId))
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