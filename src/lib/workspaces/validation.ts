import type { DBUser } from '@/lib/auth/types'

export function validateAndGetUser(userId: string): DBUser {
  if (!userId) {
    throw new Error('User not found')
  }
  return { id: userId } as DBUser
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