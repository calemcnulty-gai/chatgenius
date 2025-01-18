'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { UserDisplay } from '@/components/ui/UserDisplay'
import { PlusIcon } from '@heroicons/react/24/outline'
import { InviteModal } from './InviteModal'
import { PusherEvent } from '@/types/events'
import { useUserChannel } from '@/contexts/pusher/UserChannelContext'
import { User } from '@/types/user'
import { now } from '@/types/timestamp'

interface NewUserEvent {
  id: string
  workspaceId: string
  name: string
  profileImage: string | null
}

interface UserLeftEvent {
  userId: string
}

interface UserStatusEvent {
  userId: string
  status: 'active' | 'away' | 'offline'
}

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
  const { user } = useUserAuth()
  const { channel: userChannel } = useUserChannel()
  const [isLoading, setIsLoading] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [users, setUsers] = useState(initialUsers)

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id || !userChannel) return

    console.log('[UserList] Setting up event listeners')
    
    const handleNewUser = (data: NewUserEvent) => {
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
          isAi: false, // New users from invites are never AI
          lastHeartbeat: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        }])
      }
    }

    const handleStatusChange = (data: UserStatusEvent) => {
      console.log('[UserList] Received status change:', data)
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user.id === data.userId
            ? { ...user, status: data.status }
            : user
        )
      )
    }

    const handleUserLeft = (data: UserLeftEvent) => {
      setUsers(currentUsers =>
        currentUsers.filter(user => user.id !== data.userId)
      )
    }

    // Bind event handlers
    userChannel.bind('new-user', handleNewUser)
    userChannel.bind(PusherEvent.USER_STATUS_CHANGED, handleStatusChange)
    userChannel.bind('user-left', handleUserLeft)

    // Cleanup function
    return () => {
      console.log('[UserList] Cleaning up event listeners')
      userChannel.unbind('new-user', handleNewUser)
      userChannel.unbind(PusherEvent.USER_STATUS_CHANGED, handleStatusChange)
      userChannel.unbind('user-left', handleUserLeft)
    }
  }, [user?.id, userChannel, workspace.id])

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
                  user.isAi || user.status === 'active'
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