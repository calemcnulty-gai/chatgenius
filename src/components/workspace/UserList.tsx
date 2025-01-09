'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { PlusIcon } from '@heroicons/react/24/outline'
import { InviteModal } from './InviteModal'
import { PusherEvent, NewUserEvent, UserStatusEvent } from '@/types/events'
import { pusherClient } from '@/lib/pusher'
import { User } from '@/types/user'

type UserListProps = {
  users: User[]
  workspace: {
    id: string
    name: string
    slug: string
  }
}

export function UserList({ users: initialUsers, workspace }: UserListProps) {
  const router = useRouter()
  const params = useParams()
  const { userId } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [users, setUsers] = useState(initialUsers)

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId || !pusherClient) return

    const userChannel = pusherClient.subscribe(`user-${userId}`)
    
    // Listen for new users
    userChannel.bind(PusherEvent.NEW_USER, (data: NewUserEvent) => {
      if (data.workspaceId === workspace.id) {
        const now = new Date().toISOString()
        setUsers(currentUsers => [...currentUsers, {
          id: data.id,
          clerkId: '', // We don't have this from the event
          name: data.name,
          email: '', // We don't have this from the event
          profileImage: data.profileImage,
          displayName: null,
          title: null,
          timeZone: null,
          status: 'offline',
          createdAt: now,
          updatedAt: now,
        }])
      }
    })

    // Listen for user status changes
    userChannel.bind(PusherEvent.USER_STATUS_CHANGED, (data: UserStatusEvent) => {
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user.id === data.userId
            ? { ...user, status: data.status }
            : user
        )
      )
    })

    // Listen for users leaving
    userChannel.bind(PusherEvent.USER_LEFT, (data: { userId: string }) => {
      setUsers(currentUsers =>
        currentUsers.filter(user => user.id !== data.userId)
      )
    })

    return () => {
      if (!pusherClient) return
      userChannel.unbind_all()
      pusherClient.unsubscribe(`user-${userId}`)
    }
  }, [userId, workspace.id])

  // Update users when initial data changes
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const handleUserClick = async (user: User) => {
    if (isLoading) return
    setIsLoading(true)

    try {
      // Try to create/get DM channel
      const response = await fetch('/api/dm/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create/get DM channel')
      }

      const data = await response.json()
      if (data.status === 'success' && data.channelId) {
        router.push(`/workspace/${workspace.slug}/dm/${data.channelId}`)
      } else {
        throw new Error(data.message || 'Failed to create DM channel')
      }
    } catch (error) {
      console.error('Error handling user click:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-col">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-sm font-semibold uppercase text-gray-400">Users</h2>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="text-gray-400 hover:text-gray-300"
            title="Invite users"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1">
          {users.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserClick(user)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-gray-400 hover:bg-gray-800 hover:text-gray-300 cursor-pointer ${
                isLoading ? 'cursor-wait opacity-50' : ''
              }`}
            >
              <div className="relative">
                <UserAvatar
                  user={user}
                  size="sm"
                />
                <div
                  className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-gray-900 ${
                    user.status === 'active'
                      ? 'bg-green-500'
                      : user.status === 'away'
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                  }`}
                />
              </div>
              <span className="truncate text-sm">{user.displayName || user.name}</span>
            </div>
          ))}
        </div>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
    </>
  )
} 