import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { now } from '@/types/timestamp'
import type { DBUser, UpdateProfileParams, UserProfile } from './types'

export async function findUserByClerkId(clerkId: string): Promise<DBUser | undefined> {
  return await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  })
}

export async function getUserProfile(clerkId: string): Promise<UserProfile | undefined> {
  const user = await findUserByClerkId(clerkId)
  if (!user) return undefined

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage,
  }
}

export async function updateUserProfile(params: UpdateProfileParams): Promise<DBUser> {
  const [user] = await db
    .update(users)
    .set({
      ...(params.name && { name: params.name }),
      ...(params.displayName !== undefined && { displayName: params.displayName }),
      ...(params.title !== undefined && { title: params.title }),
      ...(params.timeZone !== undefined && { timeZone: params.timeZone }),
      ...(params.profileImage !== undefined && { profileImage: params.profileImage }),
      updatedAt: now(),
    })
    .where(eq(users.clerkId, params.clerkId))
    .returning()

  return user
} 