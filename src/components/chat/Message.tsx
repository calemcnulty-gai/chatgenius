'use client'

import { useAuth } from '@clerk/nextjs'
import { UserAvatar } from '@/components/ui/UserAvatar'

type MessageProps = {
  content: string
  sender: {
    id: string
    name: string
    profileImage: string | null
  }
  createdAt: string
}

export function Message({ content, sender, createdAt }: MessageProps) {
  const { userId } = useAuth()
  const isOwnMessage = sender.id === userId

  return (
    <div className="group flex items-start gap-3 px-4 py-1 hover:bg-gray-800/50">
      <div className="flex-shrink-0">
        <UserAvatar 
          name={sender.name} 
          image={sender.profileImage} 
          className="h-9 w-9"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-white hover:underline">
            {sender.name}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(createdAt).toLocaleTimeString([], { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
        </div>
        <div className="mt-0.5 text-gray-100">
          {content}
        </div>
      </div>
    </div>
  )
} 