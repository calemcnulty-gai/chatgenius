'use client'

import { useEffect, useState } from 'react'
import { Message } from './Message'
import { MessageInput } from './MessageInput'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { pusherClient } from '@/lib/pusher'

type ThreadPanelProps = {
  messageId: string
  channelId: string
  onClose: () => void
}

type ThreadMessage = {
  id: string
  content: string
  sender: {
    id: string
    name: string
    profileImage: string | null
  }
  createdAt: string
  replyCount: number
  latestReplyAt: string | null
  parentMessageId: string | null
}

export function ThreadPanel({ messageId, channelId, onClose }: ThreadPanelProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parentMessage, setParentMessage] = useState<ThreadMessage | null>(null)
  const [replies, setReplies] = useState<ThreadMessage[]>([])

  const fetchThread = async () => {
    try {
      console.log('[Thread Panel] Fetching thread for message:', messageId)
      const response = await fetch(`/api/messages/${messageId}/thread`)
      
      if (!response.ok) {
        const text = await response.text()
        console.error('[Thread Panel] Error response:', text)
        throw new Error(text || 'Failed to fetch thread')
      }

      const data = await response.json()
      console.log('[Thread Panel] Thread data:', data)
      setParentMessage(data.parentMessage)
      setReplies(data.replies || [])
      setError(null)
    } catch (err) {
      console.error('[Thread Panel] Error fetching thread:', err)
      setError(err instanceof Error ? err.message : 'Failed to load thread')
      setParentMessage(null)
      setReplies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThread()

    // Subscribe to thread updates
    const channel = pusherClient.subscribe(`thread-${messageId}`)
    channel.bind('new-reply', (newReply: ThreadMessage) => {
      // Check if this reply already exists
      setReplies(prev => {
        // If we already have this reply, don't add it again
        if (prev.some(reply => reply.id === newReply.id)) {
          console.log('[Thread Panel] Skipping duplicate reply:', newReply.id)
          return prev
        }
        
        console.log('[Thread Panel] Adding new reply:', newReply.id)
        return [...prev, newReply]
      })

      if (parentMessage) {
        setParentMessage({
          ...parentMessage,
          replyCount: (parentMessage.replyCount || 0) + 1,
          latestReplyAt: newReply.createdAt,
        })
      }
    })

    return () => {
      pusherClient.unsubscribe(`thread-${messageId}`)
    }
  }, [messageId])

  if (loading) {
    return (
      <div className="w-96 border-l border-gray-700 bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Thread</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
          <span className="ml-2 text-sm text-gray-400">Loading thread...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-96 border-l border-gray-700 bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Thread</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 rounded-md bg-red-900/50 p-4 text-sm text-red-200">
          <p>{error}</p>
          <button 
            onClick={fetchThread}
            className="mt-2 text-xs text-red-300 hover:text-red-100"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-96 flex-col border-l border-gray-700 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-700 p-4">
        <h2 className="text-lg font-semibold">Thread</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {parentMessage && (
          <div className="border-b border-gray-700 p-4">
            <Message
              key={`parent-${parentMessage.id}`}
              id={parentMessage.id}
              content={parentMessage.content}
              sender={parentMessage.sender}
              createdAt={parentMessage.createdAt}
              replyCount={parentMessage.replyCount}
              latestReplyAt={parentMessage.latestReplyAt}
              channelId={channelId}
            />
          </div>
        )}

        <div className="space-y-4 p-4">
          {replies.length === 0 ? (
            <div className="text-center text-sm text-gray-500">
              No replies yet. Start the conversation!
            </div>
          ) : (
            replies.map(reply => (
              <Message
                key={`reply-${reply.id}`}
                id={reply.id}
                content={reply.content}
                sender={reply.sender}
                createdAt={reply.createdAt}
                parentMessageId={messageId}
                channelId={channelId}
              />
            ))
          )}
        </div>
      </div>

      <div className="border-t border-gray-700 p-4">
        <MessageInput
          channelId={channelId}
          parentMessageId={messageId}
          placeholder="Reply in thread..."
          onMessageSent={fetchThread}
        />
      </div>
    </div>
  )
} 