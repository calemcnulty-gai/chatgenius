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
    setIsLoading(true)
    fetchMessages()
  }, [channelId])

  // Set up Pusher subscription
  useEffect(() => {
    const channelName = `channel-${channelId}`

    // Subscribe if not already subscribed
    if (!pusherClient.channel(channelName)) {
      pusherClient.subscribe(channelName)
    }

    // Listen for new messages
    const handleNewMessage = (newMessage: MessageData) => {
      setMessages((currentMessages) => [...currentMessages, newMessage])
    }

    const channel = pusherClient.channel(channelName)
    channel.bind('new-message', handleNewMessage)

    // Cleanup only unbinds the event handler, doesn't unsubscribe
    return () => {
      channel?.unbind('new-message', handleNewMessage)
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