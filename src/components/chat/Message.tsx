'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { formatMessageTimestamp } from '@/lib/utils'
import { User } from '@/types/user'

type MessageProps = {
  id: string
  content: string
  sender: User
  createdAt: string
  replyCount?: number
  latestReplyAt?: string | null
  parentMessageId?: string | null
  channelId: string
}

export function Message({ 
  id,
  content,
  sender,
  createdAt,
  replyCount,
  latestReplyAt,
  parentMessageId,
  channelId,
}: MessageProps) {
  const { userId } = useAuth()
  const { user } = useUser()
  const isCurrentUser = userId === sender.clerkId

  const handleThreadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const event = new CustomEvent('open-thread', {
      detail: { messageId: id },
      bubbles: true,
    })
    window.dispatchEvent(event)
  }

  return (
    <div className="group relative flex items-start gap-x-3 hover:bg-gray-800/50 px-4 py-0.5">
      <div className="flex-shrink-0 mt-0.5">
        <UserAvatar
          user={isCurrentUser ? {
            ...sender,
            profileImage: user?.imageUrl || null,
          } : sender}
          size="sm"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-200">
            {isCurrentUser ? user?.fullName || sender.name : sender.name}
          </span>
          <span className="text-xs text-gray-500">
            {formatMessageTimestamp(createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-300 mt-0.5">{content}</p>
        {!parentMessageId && (replyCount ?? 0) > 0 && (
          <div className="mt-0.5">
            <button
              onClick={handleThreadClick}
              className="group inline-flex items-center gap-x-2 text-xs text-gray-500 hover:text-gray-300"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                {latestReplyAt && ` · ${formatMessageTimestamp(latestReplyAt)}`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 