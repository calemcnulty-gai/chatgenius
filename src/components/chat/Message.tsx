'use client'

import { useAuth } from '@clerk/nextjs'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

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
  replyCount = 0,
  latestReplyAt,
  parentMessageId,
  channelId,
}: MessageProps) {
  const hasReplies = replyCount > 0
  const isReply = !!parentMessageId
  const showThreadUI = !isReply && (hasReplies || !parentMessageId)

  const handleThreadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('[Thread] Button clicked', {
      messageId: id,
      hasReplies,
      replyCount,
      isReply,
      parentMessageId,
      eventTarget: e.target,
      currentTarget: e.currentTarget
    })
    
    try {
      // Check if window is available (client-side)
      if (typeof window === 'undefined') {
        console.error('[Thread] Window is not defined - not in browser context')
        return
      }

      const event = new CustomEvent('open-thread', {
        detail: { messageId: id },
        bubbles: true, // Ensure event bubbles up
        cancelable: true // Make event cancelable
      })

      const dispatchResult = window.dispatchEvent(event)
      console.log('[Thread] Event dispatch result:', {
        messageId: id,
        eventType: event.type,
        detail: event.detail,
        wasDispatched: dispatchResult
      })
    } catch (error: any) {
      console.error('[Thread] Error dispatching open-thread event:', {
        error,
        messageId: id,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack
      })
    }
  }

  return (
    <div className="group flex items-start gap-3 px-4 py-1 hover:bg-gray-800/50">
      <img
        src={sender.profileImage || '/default-avatar.png'}
        alt={sender.name}
        className="h-10 w-10 rounded-full"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="font-medium">{sender.name}</span>
          <span className="text-xs text-gray-400">
            {new Date(createdAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-gray-200">{content}</p>
        {showThreadUI && (
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={handleThreadClick}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-700/50 hover:text-white"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              {hasReplies ? (
                <>
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                  {latestReplyAt && (
                    <span className="ml-1 text-gray-500">
                      · Last reply {new Date(latestReplyAt).toLocaleDateString()}
                    </span>
                  )}
                </>
              ) : (
                'Reply in thread'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 