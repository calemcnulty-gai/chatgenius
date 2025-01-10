'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Message as MessageType } from '@/types/db'
import { Message } from '@/components/ui/Message'
import { MessageInput } from '@/components/ui/MessageInput'
import { PusherEvent } from '@/types/events'
import { usePusherChannel } from '@/contexts/PusherContext'

type ThreadPanelProps = {
  messageId: string
  channelId: string
  onClose: () => void
}

type ThreadData = {
  parentMessage: MessageType & {
    channelId?: string
    dmChannelId?: string
  }
  replies: MessageType[]
}

export function ThreadPanel({ messageId, channelId, onClose }: ThreadPanelProps) {
  const [thread, setThread] = useState<ThreadData | null>(null)
  const [loading, setLoading] = useState(true)
  const { userChannel } = usePusherChannel()

  // Fetch thread data
  useEffect(() => {
    async function fetchThread() {
      try {
        const response = await fetch(`/api/messages/${messageId}/thread`)
        if (!response.ok) throw new Error('Failed to fetch thread')
        const data = await response.json()
        setThread(data)
      } catch (error) {
        console.error('Error fetching thread:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchThread()
  }, [messageId])

  // Listen for thread updates
  useEffect(() => {
    if (!channelId || !userChannel) return

    // Listen for new thread replies
    userChannel.bind(PusherEvent.NEW_THREAD_REPLY, (data: MessageType) => {
      if (data.parentId === messageId) {
        setThread(current => {
          if (!current) return null
          return {
            ...current,
            replies: [...current.replies, data],
          }
        })
      }
    })

    // Listen for message updates (e.g., reply count changes)
    userChannel.bind(PusherEvent.MESSAGE_UPDATED, (data: { id: string, replyCount: number }) => {
      if (data.id === messageId) {
        setThread(current => {
          if (!current) return null
          return {
            ...current,
            parentMessage: {
              ...current.parentMessage,
              replyCount: data.replyCount,
            },
          }
        })
      }
    })

    return () => {
      userChannel.unbind(PusherEvent.NEW_THREAD_REPLY)
      userChannel.unbind(PusherEvent.MESSAGE_UPDATED)
    }
  }, [channelId, messageId, userChannel])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!thread) {
    return <div>Thread not found</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Thread</h2>
        <button onClick={onClose}>
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent message */}
        <Message
          id={thread.parentMessage.id}
          content={thread.parentMessage.content}
          sender={thread.parentMessage.sender}
          createdAt={thread.parentMessage.createdAt}
          variant="channel"
          replyCount={thread.parentMessage.replyCount}
          latestReplyAt={thread.parentMessage.latestReplyAt}
          channelId={channelId}
        />

        {/* Thread replies */}
        <div className="pl-8 space-y-4">
          {thread.replies.map((reply) => (
            <Message
              key={reply.id}
              id={reply.id}
              content={reply.content}
              sender={reply.sender}
              createdAt={reply.createdAt}
              variant="thread"
              channelId={channelId}
              parentMessageId={messageId}
            />
          ))}
        </div>
      </div>

      {/* Message input for thread */}
      <div className="p-4 border-t">
        <MessageInput
          channelId={channelId}
          parentMessageId={messageId}
          placeholder="Reply to thread..."
        />
      </div>
    </div>
  )
} 