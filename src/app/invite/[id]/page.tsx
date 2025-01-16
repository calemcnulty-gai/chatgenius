'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'
import { Loader2Icon } from 'lucide-react'

export default function InvitePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { user, isLoading } = useUser()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invite, setInvite] = useState<any>(null)

  useEffect(() => {
    if (isLoading) return

    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/invites/${params.id}`)
        if (!response.ok) {
          throw new Error('Invalid or expired invitation')
        }
        const data = await response.json()
        setInvite(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load invitation')
      }
    }

    fetchInvite()
  }, [isLoading, params.id])

  useEffect(() => {
    if (isLoading || !invite) return

    const acceptInvite = async () => {
      if (!user) {
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
            inviteId: params.id,
            workspaceId: invite.workspaceId,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.message || 'Failed to accept invitation')
        }

        // Redirect to the workspace
        router.push(`/workspace/${invite.workspaceId}`)
      } catch (error) {
        console.error('Error accepting invite:', error)
        setError(error instanceof Error ? error.message : 'Failed to accept invitation')
      } finally {
        setIsProcessing(false)
      }
    }

    acceptInvite()
  }, [isLoading, user, invite, params.id, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="rounded-lg bg-gray-800 p-8 text-center">
          <h1 className="mb-4 text-xl font-semibold text-white">Invalid Invitation</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="rounded-lg bg-gray-800 p-8 text-center">
        <Loader2Icon className="mx-auto h-8 w-8 animate-spin text-blue-500" />
        <h1 className="mt-4 text-xl font-semibold text-white">
          Processing Invitation
        </h1>
        <p className="mt-2 text-gray-400">
          Please wait while we process your invitation...
        </p>
      </div>
    </div>
  )
} 