'use client'

import { useAuth } from '@clerk/nextjs'
import { usePusherHeartbeat } from '@/hooks/usePusherHeartbeat'

export function PusherHeartbeatProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isSignedIn } = useAuth()

  // Only use the heartbeat for signed-in users
  if (isSignedIn) {
    usePusherHeartbeat()
  }

  return <>{children}</>
} 