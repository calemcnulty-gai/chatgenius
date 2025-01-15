import type { UpdateProfileParams, AuthError } from './types'

export function validateProfileUpdate(params: UpdateProfileParams): AuthError | null {
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

  if (params.timeZone && !isValidTimeZone(params.timeZone)) {
    return {
      message: 'Invalid timezone',
      code: 'INVALID_INPUT'
    }
  }

  return null
}

function isValidTimeZone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch (e) {
    return false
  }
} 