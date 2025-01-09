'use client'

import { useAuth } from '@clerk/nextjs'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import { formatMessageDate } from '@/lib/utils'

type MessageProps = {
  id: string
  content: string
  sender: {
    id: string
    name: string
    profileImage: string | null
  }
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
  const isCurrentUser = userId === sender.id

  const handleThreadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Dispatch a custom event that will be caught by the channel page
    const event = new CustomEvent('open-thread', {
      detail: { messageId: id },
      bubbles: true,
    })
    window.dispatchEvent(event)
  }

  return (
    <div className="group relative flex items-start gap-x-3">
      <UserAvatar
        name={sender.name}
        image={sender.profileImage}
        className="h-6 w-6 flex-shrink-0"
      />
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-x-2">
          <span className={`text-sm font-medium ${isCurrentUser ? 'text-blue-400' : 'text-gray-200'}`}>
            {sender.name}
          </span>
          <span className="text-xs text-gray-500" title={new Date(createdAt).toLocaleString()}>
            {formatMessageDate(createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm text-gray-300">{content}</p>
        {!parentMessageId && (
          <div className="mt-1">
            <button
              onClick={handleThreadClick}
              className="group inline-flex items-center gap-x-2 text-xs text-gray-500 hover:text-gray-300"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>
                {replyCount || 0} {replyCount === 1 ? 'reply' : 'replies'}
                {latestReplyAt && ` · ${formatMessageDate(latestReplyAt)}`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 