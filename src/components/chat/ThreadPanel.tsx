'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Message as MessageType } from '@/types/db'
import { Message } from './Message'
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
  const { userChannel } = usePusherChannel()
  const [threadData, setThreadData] = useState<ThreadData | null>(null)

  // Fetch thread data
  useEffect(() => {
    async function fetchThread() {
      console.log(`[Thread Panel] Fetching thread for message: ${messageId}`)
      const response = await fetch(`/api/messages/${messageId}/thread`)
      if (!response.ok) {
        console.error(`[Thread Panel] Failed to fetch thread: ${response.statusText}`)
        return
      }
      const data = await response.json()
      console.log(`[Thread Panel] Thread data:`, data)
      setThreadData(data)
    }

    if (messageId) {
      fetchThread()
    }
  }, [messageId])

  // Set up event listener for thread updates - this should never be cleaned up
  useEffect(() => {
    if (!userChannel || !messageId) return

    console.log(`[Thread Panel] Setting up thread event listener for ${messageId}`)
    
    // Listen for new replies
    userChannel.bind(`${PusherEvent.NEW_CHANNEL_MESSAGE}-${messageId}`, (message: MessageType) => {
      console.log(`[Thread Panel] New reply received:`, message)
      setThreadData(current => {
        if (!current) return current
        return {
          ...current,
          parentMessage: {
            ...current.parentMessage,
            replyCount: (current.parentMessage.replyCount || 0) + 1,
            latestReplyAt: message.createdAt,
          },
          replies: [...current.replies, message]
        }
      })
    })

    // Listen for reply updates
    userChannel.bind(`${PusherEvent.MESSAGE_UPDATED}-${messageId}`, (message: MessageType) => {
      console.log(`[Thread Panel] Reply updated:`, message)
      setThreadData(current => {
        if (!current) return current
        return {
          ...current,
          replies: current.replies.map(reply => 
            reply.id === message.id ? message : reply
          )
        }
      })
    })

    // Listen for reply deletions
    userChannel.bind(`${PusherEvent.MESSAGE_DELETED}-${messageId}`, (data: { messageId: string }) => {
      console.log(`[Thread Panel] Reply deleted:`, data)
      setThreadData(current => {
        if (!current) return current
        return {
          ...current,
          replies: current.replies.filter(reply => reply.id !== data.messageId)
        }
      })
    })
  }, [userChannel, messageId]) // Only depend on userChannel and messageId

  const handleMessageSent = async () => {
    // Refetch the thread data when a new message is sent
    console.log(`[Thread Panel] Message sent, refreshing thread data`)
    const response = await fetch(`/api/messages/${messageId}/thread`)
    if (!response.ok) {
      console.error(`[Thread Panel] Failed to fetch thread: ${response.statusText}`)
      return
    }
    const data = await response.json()
    setThreadData(data)
  }

  if (!threadData) {
    return null
  }

  console.log(`[Thread Panel] Using channel ID for replies:`, channelId)

  return (
    <div className="flex h-full flex-col border-l border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <h2 className="text-sm font-semibold text-gray-200">Thread</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="mb-4">
            {/* Parent message rendered directly */}
            <Message
              id={threadData.parentMessage.id}
              content={threadData.parentMessage.content}
              sender={threadData.parentMessage.sender}
              createdAt={threadData.parentMessage.createdAt}
              replyCount={threadData.parentMessage.replyCount}
              latestReplyAt={threadData.parentMessage.latestReplyAt}
              channelId={channelId}
            />
          </div>
          <div className="border-t border-gray-800">
            <div className="px-4 py-2">
              <span className="text-xs font-medium text-gray-400">
                {threadData.replies.length} {threadData.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            </div>
            <div className="space-y-4">
              {/* Replies rendered directly */}
              {threadData.replies.map(reply => (
                <Message
                  key={reply.id}
                  id={reply.id}
                  content={reply.content}
                  sender={reply.sender}
                  createdAt={reply.createdAt}
                  replyCount={reply.replyCount}
                  latestReplyAt={reply.latestReplyAt}
                  channelId={channelId}
                  parentMessageId={messageId}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <MessageInput
        channelId={channelId}
        parentMessageId={messageId}
        placeholder="Reply to thread..."
        onMessageSent={handleMessageSent}
      />
    </div>
  )
} 