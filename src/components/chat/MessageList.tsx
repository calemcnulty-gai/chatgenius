'use client'

import { useEffect, useState } from 'react'
import { Message } from './Message'
import { MessageInput } from './MessageInput'
import { pusherClient } from '@/lib/pusher'

type MessageData = {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string
    profileImage: string | null
  }
}

type MessageListProps = {
  channelId: string
}

export function MessageList({ channelId }: MessageListProps) {
  const [messages, setMessages] = useState<MessageData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?channelId=${channelId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [channelId])

  // Set up Pusher subscription
  useEffect(() => {
    // Subscribe to the channel
    const channel = pusherClient.subscribe(`channel-${channelId}`)

    // Listen for new messages
    channel.bind('new-message', (newMessage: MessageData) => {
      setMessages((currentMessages) => [...currentMessages, newMessage])
    })

    // Cleanup on unmount
    return () => {
      channel.unbind_all()
      channel.unsubscribe()
    }
  }, [channelId])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-500">Loading messages...</p>
        </div>
        <div className="shrink-0">
          <MessageInput channelId={channelId} onMessageSent={fetchMessages} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">No messages yet</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              content={message.content}
              sender={message.sender}
              createdAt={message.createdAt}
            />
          ))
        )}
      </div>
      <div className="shrink-0">
        <MessageInput channelId={channelId} onMessageSent={fetchMessages} />
      </div>
    </div>
  )
} 