import type { UpdateProfileParams } from './types'

export function validateProfileUpdate(params: UpdateProfileParams): { message: string; code: 'INVALID_INPUT' } | null {
  if (params.displayName && params.displayName.length > 50) {
    return {
      message: 'Display name must be less than 50 characters',
      code: 'INVALID_INPUT'
    }
  }

  if (params.title && params.title.length > 100) {
    return {
      message: 'Title must be less than 100 characters',
      code: 'INVALID_INPUT'
    }
  }

  if (params.name && (params.name.length < 2 || params.name.length > 50)) {
    return {
      message: 'Name must be between 2 and 50 characters',
      code: 'INVALID_INPUT'
    }
  }

  return null
}

export function validateProfileImage(url: string): { message: string; code: 'INVALID_INPUT' } | null {
  if (!url.startsWith('https://')) {
    return {
      message: 'Profile image URL must be HTTPS',
      code: 'INVALID_INPUT'
    }
  }

  return null
} 