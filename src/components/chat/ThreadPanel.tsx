'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { User } from '@/types/user'
import type { Timestamp } from '@/types/timestamp'
import { Message } from '@/components/ui/Message'
import { MessageInput } from '../ui/MessageInput'
import { PusherEvent, NewThreadReplyEvent } from '@/types/events'
import { useUserChannel } from '@/contexts/pusher/UserChannelContext'

type ThreadPanelProps = {
  messageId: string
  channelId: string
  onClose: () => void
}

type ThreadData = {
  parentMessage: {
    id: string
    content: string
    createdAt: Timestamp
    channelId?: string
    dmChannelId?: string
    replyCount: number
    latestReplyAt?: Timestamp | null
    sender: User
  }
  replies: {
    id: string
    content: string
    createdAt: Timestamp
    sender: User
  }[]
}

type ThreadReply = {
  id: string
  content: string
  createdAt: Timestamp
  channelId: string
  sender: User
}

export function ThreadPanel({ messageId, channelId, onClose }: ThreadPanelProps) {
  const [thread, setThread] = useState<ThreadData | null>(null)
  const [loading, setLoading] = useState(true)
  const { channel: userChannel } = useUserChannel()

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

    // Listen for new thread replies with a named handler
    const handleThreadReply = (data: NewThreadReplyEvent) => {
      if (data.parentMessageId === messageId) {
        setThread(current => {
          if (!current) return null
          const newReply: ThreadReply = {
            id: data.id,
            content: data.content,
            createdAt: data.createdAt,
            channelId: data.channelId,
            sender: {
              id: data.senderId,
              name: data.senderName,
              email: '', // Required by User typ
              createdAt: data.createdAt,
              updatedAt: data.createdAt,
              profileImage: data.senderProfileImage,
              status: 'offline' as const,
              displayName: null,
              title: null,
              timeZone: null,
              lastHeartbeat: null,
              isAi: false,
            }
          }
          return {
            ...current,
            replies: [...current.replies, newReply],
          }
        })
      }
    }

    // Listen for message updates with a named handler
    const handleMessageUpdate = (data: { id: string, replyCount: number }) => {
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
    }

    userChannel.bind(PusherEvent.NEW_THREAD_REPLY, handleThreadReply)
    userChannel.bind(PusherEvent.MESSAGE_UPDATED, handleMessageUpdate)

    return () => {
      userChannel.unbind(PusherEvent.NEW_THREAD_REPLY, handleThreadReply)
      userChannel.unbind(PusherEvent.MESSAGE_UPDATED, handleMessageUpdate)
    }
  }, [channelId, messageId, userChannel])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!thread) {
    return <div>Thread not found</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700 w-96">
      <div className="flex items-center justify-between p-4 border-gray-700">
        <h2 className="text-lg font-semibold text-gray-200">Thread</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* Parent message */}
        <Message
          id={thread.parentMessage.id}
          content={thread.parentMessage.content}
          sender={thread.parentMessage.sender}
          createdAt={thread.parentMessage.createdAt}
          variant="channel"
          replyCount={thread.parentMessage.replyCount}
          latestReplyAt={thread.parentMessage.latestReplyAt || undefined}
          channelId={channelId}
        />

        {/* Thread replies */}
        <div className="space-y-4">
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
      <MessageInput
        channelId={channelId}
        parentMessageId={messageId}
        placeholder="Reply to thread..."
      />
    </div>
  )
} 