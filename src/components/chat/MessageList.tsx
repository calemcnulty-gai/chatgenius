'use client'

import { useState, useEffect, useRef } from 'react'
import { Message } from '@/components/ui/Message'
import { usePusherChannel } from '@/contexts/PusherContext'
import { PusherEvent, NewDirectMessageEvent, NewChannelMessageEvent } from '@/types/events'
import { User } from '@/types/user'
import { useUser } from '@/contexts/UserContext'
import { MessageInput } from '../ui/MessageInput'
import { Timestamp, createTimestamp, now } from '@/types/timestamp'

interface MessageData {
  id: string
  content: string
  sender: User
  createdAt: Timestamp
  updatedAt: Timestamp
  parentId: string | null
  replyCount: number
  latestReplyAt: Timestamp | undefined
  parentMessageId: string | null
}

interface NewMessageEvent {
  id: string
  content: string
  channelId: string
  senderId: string
  senderClerkId: string
  senderName: string
  senderEmail: string
  senderProfileImage: string | null
  senderDisplayName: string | null
  senderTitle: string | null
  senderTimeZone: string | null
  senderCreatedAt: Timestamp
  senderUpdatedAt: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  parentId: string | null
}

interface MessageListProps {
  channelId: string
  variant?: 'channel' | 'dm'
}

export function MessageList({ channelId, variant = 'channel' }: MessageListProps) {
  const [messages, setMessages] = useState<MessageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const { user } = useUser()
  const { userChannel } = usePusherChannel()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleThreadClick = (messageId: string) => {
    const event = new CustomEvent('open-thread', {
      detail: { messageId },
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for channel:', channelId)
      const response = await fetch(`/api/messages?channelId=${channelId}&type=${variant}`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const { messages: messageData, hasMore } = await response.json()
      console.log('Received messages:', { messages: messageData, hasMore })
      // Filter out thread replies (messages with parentMessageId)
      const filteredMessages = Array.isArray(messageData) 
        ? messageData.filter(m => !m.parentMessageId)
        : []
      setMessages(filteredMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetchMessages()
  }, [channelId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!channelId || !userChannel || !user?.id) return

    const handleNewMessage = (data: NewChannelMessageEvent | NewDirectMessageEvent) => {
      console.log('[MessageList] Received new message:', {
        event: variant === 'channel' ? PusherEvent.NEW_CHANNEL_MESSAGE : PusherEvent.NEW_DIRECT_MESSAGE,
        data,
        currentChannelId: channelId,
        matches: data.channelId === channelId,
        currentUserId: user.id,
        senderUserId: data.senderId
      })

      if (data.channelId !== channelId) {
        console.log('[MessageList] Message is for different channel')
        return
      }

      setMessages(currentMessages => {
        // Check if we already have this message
        const messageExists = currentMessages.some(m => m.id === data.id)
        if (messageExists) {
          console.log('[MessageList] Message already exists:', data.id)
          return currentMessages
        }

        // Don't add thread replies to the main channel
        if (data.parentId) {
          console.log('[MessageList] Skipping thread reply:', data.id)
          return currentMessages
        }

        const newMessage: MessageData = {
          id: data.id,
          content: data.content,
          sender: {
            id: data.senderId,
            clerkId: data.senderClerkId,
            name: data.senderName,
            email: data.senderEmail,
            profileImage: data.senderProfileImage,
            displayName: data.senderDisplayName,
            title: data.senderTitle,
            timeZone: data.senderTimeZone,
            status: 'active',
            lastHeartbeat: null,
            createdAt: data.senderCreatedAt,
            updatedAt: data.senderUpdatedAt,
          },
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          parentId: data.parentId,
          replyCount: 0,
          latestReplyAt: undefined,
          parentMessageId: null,
        }

        // Replace temporary message if it exists
        const tempMessageIndex = currentMessages.findIndex(m => 
          m.content === newMessage.content && 
          m.sender.id === newMessage.sender.id
        )

        if (tempMessageIndex !== -1) {
          console.log('[MessageList] Replacing temporary message')
          const newMessages = [...currentMessages]
          newMessages[tempMessageIndex] = newMessage
          return newMessages
        }

        console.log('[MessageList] Adding new message')
        return [...currentMessages, newMessage]
      })
    }

    console.log('[MessageList] Setting up Pusher binding for channel:', channelId)
    console.log('[MessageList] Current user ID:', user.id)
    console.log('[MessageList] User channel:', userChannel.name)
    
    // Handle regular channel messages
    if (variant === 'channel') {
      userChannel.bind(PusherEvent.NEW_CHANNEL_MESSAGE, handleNewMessage)
    } else {
      // Handle direct messages
      userChannel.bind(PusherEvent.NEW_DIRECT_MESSAGE, handleNewMessage)
    }

    // Handle thread replies with a named handler function
    const handleThreadReply = (data: any) => {
      console.log('[MessageList] Received thread reply:', {
        event: PusherEvent.NEW_THREAD_REPLY,
        data,
        currentChannelId: channelId,
        matches: data.channelId === channelId,
        currentUserId: user.id,
        senderUserId: data.senderId
      })
      
      // Update the reply count of the parent message regardless of channel
      setMessages(currentMessages => {
        return currentMessages.map(message => {
          if (message.id === data.parentMessageId) {
            console.log('[MessageList] Updating reply count for message:', message.id, 'from', message.replyCount, 'to', (message.replyCount || 0) + 1)
            return {
              ...message,
              replyCount: (message.replyCount || 0) + 1,
              latestReplyAt: data.createdAt
            }
          }
          return message
        })
      })
    }

    userChannel.bind(PusherEvent.NEW_THREAD_REPLY, handleThreadReply)

    // Handle typing events for DMs
    if (variant === 'dm') {
      const handleTypingStart = (data: { userId: string }) => {
        if (data.userId !== user.id) {
          setIsTyping(true)
          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
          // Set new timeout to clear typing indicator
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
          }, 3000)
        }
      }

      userChannel.bind('typing-start', handleTypingStart)

      return () => {
        userChannel.unbind('typing-start', handleTypingStart)
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }
    }

    return () => {
      if (!userChannel) return
      if (variant === 'channel') {
        userChannel.unbind(PusherEvent.NEW_CHANNEL_MESSAGE)
      } else {
        userChannel.unbind(PusherEvent.NEW_DIRECT_MESSAGE)
      }
      userChannel.unbind(PusherEvent.NEW_THREAD_REPLY, handleThreadReply)
    }
  }, [user?.id, userChannel, channelId, variant])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Message
            key={message.id}
            id={message.id}
            content={message.content}
            sender={message.sender}
            createdAt={message.createdAt}
            variant={variant}
            replyCount={message.replyCount}
            latestReplyAt={message.latestReplyAt}
            onThreadClick={handleThreadClick}
          />
        ))}
        {isTyping && variant === 'dm' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="animate-bounce">•</div>
            <div className="animate-bounce delay-100">•</div>
            <div className="animate-bounce delay-200">•</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-800">
        <MessageInput 
          channelId={channelId}
          variant={variant}
          onMessageSent={scrollToBottom}
        />
      </div>
    </div>
  )
} 