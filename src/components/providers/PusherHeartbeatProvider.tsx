'use client'

import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { usePusherHeartbeat } from '@/hooks/usePusherHeartbeat'

export function PusherHeartbeatProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUserAuth()

  // Only use the heartbeat for authenticated users
  if (user) {
    usePusherHeartbeat()
  }

  return <>{children}</>
} 