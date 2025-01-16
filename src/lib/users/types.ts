import type { DBUser } from '@/lib/auth/types'

export interface UpdateProfileParams {
  userId: string
  displayName?: string | null
  title?: string | null
  timeZone?: string | null
  profileImage?: string | null
  name?: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  profileImage: string | null
}

export interface UserResponse {
  user: UserProfile | null
  error?: {
    message: string
    code: 'NOT_FOUND' | 'INVALID_INPUT'
  }
}

export interface UpdateProfileResponse {
  user: DBUser | null
  error?: {
    message: string
    code: 'NOT_FOUND' | 'INVALID_INPUT'
  }
} 