'use client'

import { useUser } from '@/contexts/UserContext'
import { usePusherHeartbeat } from '@/hooks/usePusherHeartbeat'

export function PusherHeartbeatProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()

  // Only use the heartbeat for authenticated users
  if (user) {
    usePusherHeartbeat()
  }

  return <>{children}</>
} 