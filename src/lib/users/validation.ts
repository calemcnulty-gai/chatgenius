import type { UpdateProfileParams, UserError } from './types'

export function validateProfileUpdate(params: UpdateProfileParams): UserError | null {
  if (params.name && (params.name.length < 2 || params.name.length > 50)) {
    return {
      message: 'Name must be between 2 and 50 characters',
      code: 'INVALID_INPUT'
    }
  }

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

export function validateProfileImage(url: string | null): UserError | null {
  if (url && !isValidUrl(url)) {
    return {
      message: 'Invalid profile image URL',
      code: 'INVALID_INPUT'
    }
  }

  return null
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
} 