'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { UserDisplay } from '@/components/ui/UserDisplay'
import { User } from '@/types/user'

type StartDMModalProps = {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  workspaceSlug: string
  users: User[]
}

export function StartDMModal({ isOpen, onClose, workspaceId, workspaceSlug, users }: StartDMModalProps) {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStartDM = async () => {
    if (!selectedUser || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      console.log('Starting DM creation...')
      const response = await fetch('/api/dm/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          userId: selectedUser.id,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to start DM')
      }

      const { channelId } = await response.json()
      console.log('DM channel created:', channelId)
      
      console.log('Navigating to channel:', `/workspace/${workspaceSlug}/dm/${channelId}`)
      router.push(`/workspace/${workspaceSlug}/dm/${channelId}`)
      onClose()
    } catch (error) {
      console.error('Error starting DM:', error)
      setError(error instanceof Error ? error.message : 'Failed to start DM')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-gray-800 p-6">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-medium text-white">
              Start a Direct Message
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-4">
            <div className="space-y-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 ${
                    selectedUser?.id === user.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="relative">
                    <UserAvatar
                      user={user}
                      size="md"
                    />
                    <div
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-800 ${
                        user.status === 'active'
                          ? 'bg-green-500'
                          : user.status === 'away'
                          ? 'bg-yellow-500'
                          : 'bg-gray-500'
                      }`}
                    />
                  </div>
                  <UserDisplay 
                    user={user}
                    variant="text-with-status"
                    className="flex-1 text-left"
                  />
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-500">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDM}
                disabled={!selectedUser || isSubmitting}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Starting...' : 'Start DM'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 