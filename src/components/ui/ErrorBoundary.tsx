'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Reset error boundary when route changes
  }, [pathname, searchParams])

  return <>{children}</>
} 