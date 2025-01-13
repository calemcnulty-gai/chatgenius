'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useUser } from '@/contexts/UserContext'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { UserDisplay } from '@/components/ui/UserDisplay'
import { PlusIcon } from '@heroicons/react/24/outline'
import { InviteModal } from './InviteModal'
import { PusherEvent, NewUserEvent, UserStatusEvent } from '@/types/events'
import { usePusherChannel } from '@/contexts/PusherContext'
import { User } from '@/types/user'
import { now } from '@/types/timestamp'

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
  const { userChannel } = usePusherChannel()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [users, setUsers] = useState(initialUsers)

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId || !userChannel) return

    console.log('[UserList] Setting up event listeners')
    
    // Listen for new users
    userChannel.bind(PusherEvent.NEW_USER, (data: NewUserEvent) => {
      if (data.workspaceId === workspace.id) {
        const timestamp = now()
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
          lastHeartbeat: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        }])
      }
    })

    // Listen for user status changes
    userChannel.bind(PusherEvent.USER_STATUS_CHANGED, (data: UserStatusEvent) => {
      console.log('[UserList] Received status change:', data)
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
      if (!userChannel) return
      userChannel.unbind(PusherEvent.NEW_USER)
      userChannel.unbind(PusherEvent.USER_STATUS_CHANGED)
      userChannel.unbind(PusherEvent.USER_LEFT)
    }
  }, [userId, workspace.id, userChannel])

  // Update users when initial data changes
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const handleUserClick = async (user: User) => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const response = await fetch('/api/dm/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: workspace.id,
          otherUserId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create DM channel')
      }

      const channel = await response.json()
      router.push(`/workspace/${workspace.slug}/dm/${channel.id}`)
    } catch (error) {
      console.error('Error creating DM channel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Update heartbeat
    const interval = setInterval(() => {
      if (user?.id) {
        fetch('/api/users/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            timestamp: now()
          }),
        }).catch(console.error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [user?.id])

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-2 py-2">
        <h2 className="text-sm font-semibold text-gray-400">USERS</h2>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="text-gray-400 hover:text-gray-300"
        >
          <PlusIcon className="h-5 w-5" />
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
            <UserDisplay 
              user={user}
              variant="text-with-status"
              className="truncate text-sm"
            />
          </div>
        ))}
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
      />
    </div>
  )
} 