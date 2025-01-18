import { useState } from 'react'

export interface UserProfileState {
  isUpdating: boolean
  error: string | null
}

export function useProfileState() {
  return useState<UserProfileState>({
    isUpdating: false,
    error: null,
  })
} 