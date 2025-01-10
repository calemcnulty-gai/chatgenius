'use client'

import { useState, useEffect, useRef } from 'react'
import { Message } from '@/components/ui/Message'
import { usePusherChannel } from '@/contexts/PusherContext'
import { PusherEvent } from '@/types/events'
import { User } from '@/types/user'
import { useUser } from '@/contexts/UserContext'
import { MessageInput } from '@/components/ui/MessageInput'

interface MessageData {
  id: string
  content: string
  sender: User
  createdAt: string
  updatedAt: string
  parentId: string | null
  replyCount: number
  latestReplyAt: string | null
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
  senderNamePronunciation: string | null
  senderTimeZone: string | null
  senderCreatedAt: string
  senderUpdatedAt: string
  createdAt: string
  updatedAt: string
  parentId: string | null
}

interface MessageListProps {
  channelId: string
  variant?: 'channel' | 'dm'
}

export function MessageList({ channelId, variant = 'channel' }: MessageListProps) {
  const [messages, setMessages] = useState<MessageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { userChannel } = usePusherChannel()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleThreadClick = (messageId: string) => {
    const event = new CustomEvent('open-thread', {
      detail: { messageId },
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  const safeDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return new Date()
    try {
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? new Date() : date
    } catch (error) {
      return new Date()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for channel:', channelId)
      const response = await fetch(`/api/messages?channelId=${channelId}`)
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
    if (!user?.id || !userChannel) return

    console.log('[MessageList] Setting up Pusher binding for channel:', channelId)
    console.log('[MessageList] Current user ID:', user.id)
    console.log('[MessageList] User channel:', userChannel.name)
    
    // Handle regular channel messages
    userChannel.bind(PusherEvent.NEW_CHANNEL_MESSAGE, (data: NewMessageEvent) => {
      console.log('[MessageList] Received channel message:', {
        event: PusherEvent.NEW_CHANNEL_MESSAGE,
        data,
        currentChannelId: channelId,
        matches: data.channelId === channelId,
        currentUserId: user.id,
        senderUserId: data.senderId
      })
      
      if (data.channelId === channelId) {
        handleNewMessage(data)
      }
    })

    // Handle direct messages
    userChannel.bind(PusherEvent.NEW_DIRECT_MESSAGE, (data: NewMessageEvent) => {
      console.log('[MessageList] Received direct message:', {
        event: PusherEvent.NEW_DIRECT_MESSAGE,
        data,
        currentChannelId: channelId,
        matches: data.channelId === channelId,
        currentUserId: user.id,
        senderUserId: data.senderId
      })
      
      if (data.channelId === channelId) {
        handleNewMessage(data)
      }
    })

    // Helper function to handle new messages
    const handleNewMessage = (data: NewMessageEvent) => {
      console.log('[MessageList] Adding new message to state')
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
            createdAt: safeDate(data.senderCreatedAt).toISOString(),
            updatedAt: safeDate(data.senderUpdatedAt).toISOString(),
          },
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          parentId: data.parentId,
          replyCount: 0,
          latestReplyAt: null,
          parentMessageId: null,
        }

        // Replace temporary message if it exists
        const tempMessageIndex = currentMessages.findIndex(m => 
          m.content === newMessage.content && 
          m.sender.id === newMessage.sender.id &&
          new Date(m.createdAt).getTime() > Date.now() - 5000 // Within last 5 seconds
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

    return () => {
      if (!userChannel) return
      userChannel.unbind_all()
      userChannel.unsubscribe()
    }
  }, [user?.id, userChannel, channelId])

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
            latestReplyAt={message.latestReplyAt || undefined}
            parentMessageId={message.parentMessageId || undefined}
            channelId={channelId}
            onThreadClick={handleThreadClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        channelId={channelId}
        onMessageSent={fetchMessages}
        className="border-t-0"
      />
    </div>
  )
} 