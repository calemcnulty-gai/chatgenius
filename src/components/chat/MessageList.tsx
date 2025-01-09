'use client'

import { useEffect, useState, useRef } from 'react'
import { Message } from './Message'
import { MessageInput } from './MessageInput'
import { PusherEvent, NewChannelMessageEvent, NewDirectMessageEvent, MessageUpdatedEvent } from '@/types/events'
import { useAuth } from '@clerk/nextjs'
import { usePusherChannel } from '@/contexts/PusherContext'

type MessageData = {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string
    profileImage: string | null
  }
  replyCount: number
  latestReplyAt: string | null
  parentMessageId: string | null
}

type MessageListProps = {
  channelId: string
}

export function MessageList({ channelId }: MessageListProps) {
  const { userId } = useAuth()
  const { userChannel } = usePusherChannel()
  const [messages, setMessages] = useState<MessageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async (cursor?: string) => {
    try {
      const url = new URL('/api/messages', window.location.origin)
      url.searchParams.set('channelId', channelId)
      url.searchParams.set('includeReplies', 'false')
      if (cursor) {
        url.searchParams.set('cursor', cursor)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      
      setMessages(prev => cursor ? [...prev, ...data.messages] : data.messages)
      setHasMore(data.hasMore)
      setNextCursor(data.nextCursor)

      // Scroll to bottom after loading initial messages
      if (!cursor) {
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    setMessages([])
    setHasMore(false)
    setNextCursor(undefined)
    fetchMessages()
  }, [channelId])

  // Set up Pusher subscription
  useEffect(() => {
    if (!userId || !userChannel) return

    // Listen for new channel messages
    userChannel.bind(PusherEvent.NEW_CHANNEL_MESSAGE, (data: NewChannelMessageEvent) => {
      if (data.channelId === channelId && !data.parentMessageId) {
        setMessages((currentMessages) => {
          if (currentMessages.some(msg => msg.id === data.id)) {
            return currentMessages
          }
          const newMessages = [{
            id: data.id,
            content: data.content,
            createdAt: data.createdAt,
            sender: {
              id: data.senderId,
              name: data.senderName,
              profileImage: data.senderProfileImage
            },
            replyCount: 0,
            latestReplyAt: null,
            parentMessageId: null
          }, ...currentMessages]
          // Scroll to bottom when new message arrives
          setTimeout(scrollToBottom, 100)
          return newMessages
        })
      }
    })

    return () => {
      if (!userChannel) return
      userChannel.unbind(PusherEvent.NEW_CHANNEL_MESSAGE)
    }
  }, [userId, channelId, userChannel])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-gray-500">No messages yet</div>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {messages.map((message) => (
              <Message
                key={message.id}
                id={message.id}
                content={message.content}
                sender={message.sender}
                createdAt={message.createdAt}
                replyCount={message.replyCount}
                latestReplyAt={message.latestReplyAt}
                channelId={channelId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <MessageInput
        channelId={channelId}
        onMessageSent={() => fetchMessages()}
      />
    </div>
  )
} 