'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { useAuthSync } from '@/hooks/useAuthSync'

function AuthSyncWrapper({ children }: { children: React.ReactNode }) {
  useAuthSync()
  return children
}

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AuthSyncWrapper>{children}</AuthSyncWrapper>
    </ClerkProvider>
  )
} 