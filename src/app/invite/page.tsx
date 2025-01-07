'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Loader2Icon } from 'lucide-react'

export default function InvitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn, userId } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const workspaceId = searchParams.get('workspace')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!isLoaded) return
    if (!workspaceId || !email) {
      setError('Invalid invitation link')
      return
    }

    const acceptInvite = async () => {
      if (!isSignedIn) {
        // Redirect to sign up if not signed in
        router.push(`/sign-up?redirect_url=${encodeURIComponent(window.location.href)}`)
        return
      }

      setIsProcessing(true)
      setError(null)

      try {
        const response = await fetch('/api/invites/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workspaceId,
            email,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'Failed to accept invitation')
        }

        // Redirect to the workspace
        router.push(`/workspace/${workspaceId}`)
      } catch (error) {
        console.error('Error accepting invite:', error)
        setError(error instanceof Error ? error.message : 'Failed to accept invitation')
      } finally {
        setIsProcessing(false)
      }
    }

    acceptInvite()
  }, [isLoaded, isSignedIn, workspaceId, email, router])

  if (!workspaceId || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="rounded-lg bg-gray-800 p-8 text-center">
          <h1 className="mb-4 text-xl font-semibold text-white">Invalid Invitation</h1>
          <p className="text-gray-400">This invitation link appears to be invalid.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="rounded-lg bg-gray-800 p-8 text-center">
        {isProcessing ? (
          <>
            <Loader2Icon className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <h1 className="mt-4 text-xl font-semibold text-white">
              Processing Invitation
            </h1>
            <p className="mt-2 text-gray-400">
              Please wait while we process your invitation...
            </p>
          </>
        ) : error ? (
          <>
            <h1 className="mb-4 text-xl font-semibold text-white">
              Error Processing Invitation
            </h1>
            <p className="text-red-500">{error}</p>
          </>
        ) : null}
      </div>
    </div>
  )
} 