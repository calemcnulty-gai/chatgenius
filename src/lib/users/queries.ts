import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { now } from '@/types/timestamp'
import type { DBUser } from '@/lib/auth/types'
import type { UpdateProfileParams, UserProfile } from './types'

export async function getUserProfile(userId: string): Promise<UserProfile | undefined> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })
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
    .where(eq(users.id, params.userId))
    .returning()

  return user
} 