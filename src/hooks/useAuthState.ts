import { useState } from 'react'
import type { User } from '@/types/user'

export interface UserAuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

export function useAuthState() {
  return useState<UserAuthState>({
    user: null,
    isLoading: true,
    error: null,
  })
} 