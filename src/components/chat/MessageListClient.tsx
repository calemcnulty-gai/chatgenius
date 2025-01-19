'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Message } from '@/components/ui/Message'
import { useUserChannel } from '@/contexts/pusher/UserChannelContext'
import { PusherEvent, NewDirectMessageEvent, NewChannelMessageEvent } from '@/types/events'
import { User } from '@/types/user'
import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { MessageInput } from '../ui/MessageInput'
import { Timestamp } from '@/types/timestamp'

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

interface MessageListClientProps {
  channelId: string
  variant?: 'channel' | 'dm'
  initialMessages: MessageData[]
}

export function MessageListClient({ channelId, variant = 'channel', initialMessages = [] }: MessageListClientProps) {
  console.log('[MessageList] Mounting/rendering', { channelId, variant })
  
  const [messages, setMessages] = useState<MessageData[]>(initialMessages)
  const [isTyping, setIsTyping] = useState(false)
  const { user } = useUserAuth()
  const { channel: userChannel, subscriptionState } = useUserChannel()
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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleNewMessage = useCallback((data: NewChannelMessageEvent | NewDirectMessageEvent) => {
    // If data is a string (raw JSON), parse it
    const messageData = typeof data === 'string' ? JSON.parse(data) : data

    if (messageData.channelId !== channelId) {
      return
    }

    setMessages(currentMessages => {
      // Check if we already have this message
      const messageExists = currentMessages.some(m => m.id === messageData.id)
      if (messageExists) {
        return currentMessages
      }

      // Don't add thread replies to the main channel
      if (messageData.parentId) {
        return currentMessages
      }

      const newMessage: MessageData = {
        id: messageData.id,
        content: messageData.content,
        sender: {
          id: messageData.senderId,
          name: messageData.senderName,
          email: messageData.senderEmail,
          profileImage: messageData.senderProfileImage,
          displayName: messageData.senderDisplayName,
          title: messageData.senderTitle,
          timeZone: messageData.senderTimeZone,
          status: 'active',
          isAi: false,
          lastHeartbeat: null,
          createdAt: messageData.senderCreatedAt,
          updatedAt: messageData.senderUpdatedAt,
        },
        createdAt: messageData.createdAt,
        updatedAt: messageData.updatedAt,
        parentId: messageData.parentId,
        replyCount: 0,
        latestReplyAt: undefined,
        parentMessageId: null,
      }

      return [...currentMessages, newMessage]
    })
  }, [channelId])

  useEffect(() => {
    if (!userChannel || !user?.id || subscriptionState !== 'SUBSCRIBED') {
      console.log('[MessageList] Skipping event binding', { 
        userId: user?.id,
        subscriptionState 
      })
      return
    }

    const eventName = variant === 'channel' ? PusherEvent.NEW_CHANNEL_MESSAGE : PusherEvent.NEW_DIRECT_MESSAGE
    console.log('[MessageList] Binding event listener to user channel', { userId: user.id, eventName })
    userChannel.bind(eventName, handleNewMessage)

    return () => {
      console.log('[MessageList] Cleaning up user channel listener', { userId: user.id, eventName })
      userChannel.unbind(eventName, handleNewMessage)
    }
  }, [userChannel, user?.id, variant, handleNewMessage, subscriptionState])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages?.map((message) => (
          <Message
            key={message.id}
            id={message.id}
            content={message.content}
            sender={message.sender}
            createdAt={message.createdAt}
            variant={variant}
            replyCount={message.replyCount}
            latestReplyAt={message.latestReplyAt}
            parentMessageId={message.parentMessageId || undefined}
            channelId={channelId}
            onThreadClick={handleThreadClick}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput channelId={channelId} variant={variant} />
    </div>
  )
} 