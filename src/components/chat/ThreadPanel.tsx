'use client'

import { useEffect, useState } from 'react'
import { Message } from './Message'
import { MessageInput } from './MessageInput'
import { getPusherClient } from '@/lib/pusher'

export function ThreadPanel({ messageId, onClose }: { messageId: string, onClose: () => void }) {
  const [replies, setReplies] = useState<any[]>([])
  const [parentMessage, setParentMessage] = useState<any>(null)

  useEffect(() => {
    if (!messageId) return

    // Get the Pusher client
    const pusherClient = getPusherClient()

    const channel = pusherClient.subscribe(`thread-${messageId}`)

    // Listen for new replies
    channel.bind('new-reply', (data: any) => {
      console.log(`[ThreadPanel] Received new reply:`, data)
      setReplies(currentReplies => {
        // Avoid duplicate messages
        if (currentReplies.some(reply => reply.id === data.id)) {
          return currentReplies
        }
        return [...currentReplies, data]
      })
    })

    // Handle subscription errors
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error(`[ThreadPanel] Subscription error for thread-${messageId}:`, error)
    })

    // Fetch thread messages
    const fetchThread = async () => {
      try {
        const response = await fetch(`/api/messages/${messageId}/thread`)
        if (!response.ok) throw new Error('Failed to fetch thread')
        const data = await response.json()
        setParentMessage(data.parentMessage)
        setReplies(data.replies)
      } catch (error) {
        console.error('Error fetching thread:', error)
      }
    }

    fetchThread()

    return () => {
      channel.unbind_all()
      pusherClient.unsubscribe(`thread-${messageId}`)
    }
  }, [messageId])

  if (!parentMessage) return null

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-2">
        <h2 className="text-lg font-semibold">Thread</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <Message message={parentMessage} isParentMessage />
        <div className="mt-4 space-y-4">
          {replies.map(reply => (
            <Message key={reply.id} message={reply} />
          ))}
        </div>
      </div>
      <div className="border-t border-gray-700 p-4">
        <MessageInput channelId={parentMessage.channelId} parentMessageId={messageId} />
      </div>
    </div>
  )
} 