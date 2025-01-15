import { getOrCreateUser } from '@/lib/db/users'
import type { User } from '@clerk/nextjs/server'

export async function validateAndGetUser(clerkUser: User) {
  return await getOrCreateUser({
    id: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    emailAddresses: clerkUser.emailAddresses,
    imageUrl: clerkUser.imageUrl,
  })
}

export function validateWorkspaceName(name: string): string | null {
  if (!name) {
    return 'Workspace name is required'
  }
  if (name.length < 3) {
    return 'Workspace name must be at least 3 characters long'
  }
  if (name.length > 50) {
    return 'Workspace name must be less than 50 characters long'
  }
  return null
}

export function generateWorkspaceSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-')
} 