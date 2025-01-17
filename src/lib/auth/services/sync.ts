import { createOrUpdateUser, addUserToGauntlet } from '../queries'
import type { SyncUserParams, DBUser, AuthError } from '../types'

function getNameFromEmail(email: string): string {
  return email.split('@')[0]
}

export async function syncUser({ 
  clerkUser 
}: SyncUserParams): Promise<{ user: DBUser | null; error?: AuthError }> {
  try {
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      return {
        user: null,
        error: {
          message: 'User must have an email address',
          code: 'INVALID_INPUT'
        }
      }
    }

    // Get name from firstName/lastName if available, otherwise use email prefix
    const firstName = clerkUser.firstName?.trim() || ''
    const lastName = clerkUser.lastName?.trim() || ''
    const name = firstName || lastName 
      ? [firstName, lastName].filter(n => n).join(' ')
      : getNameFromEmail(email)

    // Create or update user in our database
    const user = await createOrUpdateUser({
      clerkId: clerkUser.id,
      name,
      email,
      profileImage: clerkUser.imageUrl,
    })

    // Add user to Gauntlet workspace
    await addUserToGauntlet(user.id)

    return { user }
  } catch (error) {
    console.error('Error syncing user:', error)
    return {
      user: null,
      error: {
        message: 'Failed to sync user',
        code: 'INVALID_INPUT'
      }
    }
  }
} 