import { useState } from 'react'
import type { UserStatus } from '@/types/user'

interface UserStatusState {
  status: UserStatus
  isUpdating: boolean
  error: string | null
}

export function useStatusState(initialStatus: UserStatus) {
  return useState<UserStatusState>({
    status: initialStatus,
    isUpdating: false,
    error: null,
  })
} 