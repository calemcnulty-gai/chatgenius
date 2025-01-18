import { useEffect } from 'react'
import type { UserStatus } from '@/types/user'

export function useAutoAway(
  isEnabled: boolean,
  currentStatus: UserStatus,
  onStatusChange: (status: UserStatus) => void
) {
  useEffect(() => {
    if (!isEnabled || currentStatus === 'offline') return
    
    let inactivityTimeout: NodeJS.Timeout
    let activityTimer: NodeJS.Timeout

    const handleActivity = () => {
      clearTimeout(inactivityTimeout)
      clearTimeout(activityTimer)

      activityTimer = setTimeout(() => {
        if (currentStatus === 'away') {
          onStatusChange('active')
        }

        inactivityTimeout = setTimeout(() => {
          if (currentStatus === 'active') {
            onStatusChange('away')
          }
        }, 5 * 60 * 1000) // 5 minutes of inactivity = away
      }, 1000)
    }

    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keydown', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      clearTimeout(inactivityTimeout)
      clearTimeout(activityTimer)
    }
  }, [isEnabled, currentStatus, onStatusChange])
} 