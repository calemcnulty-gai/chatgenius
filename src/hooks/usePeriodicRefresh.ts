import { useEffect } from 'react'
import type { User } from '@/types/user'

export function usePeriodicRefresh(
  user: User | null,
  refreshUser: () => Promise<void>,
  interval: number = 5 * 60 * 1000 // Default: 5 minutes
) {
  useEffect(() => {
    if (!user) return

    const timer = setInterval(refreshUser, interval)
    return () => clearInterval(timer)
  }, [user, refreshUser, interval])
} 