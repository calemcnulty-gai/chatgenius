import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getOrCreateUser(clerkUser: {
  id: string
  firstName: string | null
  lastName: string | null
  emailAddresses: { emailAddress: string }[]
  imageUrl: string
}) {
  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, clerkUser.id),
  })

  if (existingUser) {
    return existingUser
  }

  // Create new user
  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) throw new Error('User must have an email address')

  const newUser = {
    id: clerkUser.id,
    name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Anonymous',
    email,
    profileImage: clerkUser.imageUrl,
  }

  await db.insert(users).values(newUser)
  return newUser
} 