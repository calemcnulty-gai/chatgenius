'use client'

import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { usePusherHeartbeat } from '@/hooks/usePusherHeartbeat'

export function PusherHeartbeatProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUserAuth()
  usePusherHeartbeat(!!user)

  return <>{children}</>
} 