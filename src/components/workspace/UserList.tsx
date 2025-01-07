'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserAvatar } from '@/components/ui/UserAvatar'

type User = {
  id: string
  name: string
  profileImage: string | null
  status: 'active' | 'away' | 'offline'
}

type UserListProps = {
  users: User[]
  workspace: {
    id: string
    name: string
  }
}

export function UserList({ users, workspace }: UserListProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

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

      const { channelId } = await response.json()
      router.push(`/workspace/${workspace.id}/dm/${channelId}`)
    } catch (error) {
      console.error('Error handling user click:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <h2 className="mb-2 px-2 text-sm font-semibold uppercase text-gray-400">Users</h2>
      <div className="space-y-1">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user)}
            disabled={isLoading}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-gray-400 hover:bg-gray-800 hover:text-gray-300 ${
              isLoading ? 'cursor-wait opacity-50' : ''
            }`}
          >
            <div className="relative">
              <UserAvatar
                name={user.name}
                image={user.profileImage}
                className="h-4 w-4"
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
            <span className="truncate text-sm">{user.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
} 