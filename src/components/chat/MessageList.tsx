'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Message } from '@/components/ui/Message'
import { useUserChannel } from '@/contexts/pusher/UserChannelContext'
import { PusherEvent, NewDirectMessageEvent, NewChannelMessageEvent } from '@/types/events'
import { User } from '@/types/user'
import { useUserAuth } from '@/contexts/user/UserAuthContext'
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
  const { user } = useUserAuth()
  const { channel: userChannel, subscriptionState } = useUserChannel()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  console.log('[MessageList] Component rendering:', {
    channelId,
    variant,
    hasUser: !!user,
    userId: user?.id,
    hasUserChannel: !!userChannel,
    userChannelName: userChannel?.name,
    subscriptionState
  })

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

  const handleNewMessage = useCallback((data: NewChannelMessageEvent | NewDirectMessageEvent) => {
    console.log('[MessageList] Message handler triggered:', {
      timestamp: new Date().toISOString(),
      handlerType: 'handleNewMessage',
      rawData: data,
      dataType: typeof data,
      parsedData: typeof data === 'string' ? JSON.parse(data) : data,
      componentState: {
        channelId,
        variant,
        userId: user?.id,
        messageCount: messages.length,
        subscriptionState
      }
    })

    // If data is a string (raw JSON), parse it
    const messageData = typeof data === 'string' ? JSON.parse(data) : data
    console.log('[MessageList] Parsed message data:', {
      messageData,
      channelMatch: messageData.channelId === channelId,
      isThreadReply: !!messageData.parentId
    })

    if (messageData.channelId !== channelId) {
      console.log('[MessageList] Message is for different channel:', {
        messageChannelId: messageData.channelId,
        currentChannelId: channelId
      })
      return
    }

    setMessages(currentMessages => {
      console.log('[MessageList] Updating messages:', {
        timestamp: new Date().toISOString(),
        currentCount: currentMessages.length,
        newMessageId: messageData.id,
        messageExists: currentMessages.some(m => m.id === messageData.id),
        isThreadReply: !!messageData.parentId
      })

      // Check if we already have this message
      const messageExists = currentMessages.some(m => m.id === messageData.id)
      if (messageExists) {
        console.log('[MessageList] Message already exists:', messageData.id)
        return currentMessages
      }

      // Don't add thread replies to the main channel
      if (messageData.parentId) {
        console.log('[MessageList] Skipping thread reply:', messageData.id)
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

      console.log('[MessageList] Adding new message:', {
        newMessage,
        newCount: currentMessages.length + 1
      })
      return [...currentMessages, newMessage]
    })
  }, [channelId, variant, user?.id, messages.length, subscriptionState])

  useEffect(() => {
    console.log('[MessageList] Pusher effect dependencies changed:', {
      channelId,
      userChannelExists: !!userChannel,
      userChannelName: userChannel?.name,
      userId: user?.id,
      effectWillRun: !!(channelId && userChannel && user?.id),
      subscriptionState,
      channelCallbacks: userChannel?.callbacks ? Object.keys(userChannel.callbacks) : []
    })

    if (!channelId || !userChannel || !user?.id) {
      console.log('[MessageList] Pusher effect skipped due to missing dependencies:', {
        missingChannelId: !channelId,
        missingUserChannel: !userChannel,
        missingUserId: !user?.id
      })
      return
    }

    if (subscriptionState !== 'SUBSCRIBED') {
      console.log('[MessageList] Waiting for channel subscription to be ready:', {
        channelName: userChannel.name,
        subscriptionState
      })
      return
    }

    console.log('[MessageList] Setting up Pusher binding for channel:', channelId)
    console.log('[MessageList] Current user ID:', user.id)
    console.log('[MessageList] User channel:', userChannel.name)
    
    const eventName = variant === 'channel' ? PusherEvent.NEW_CHANNEL_MESSAGE : PusherEvent.NEW_DIRECT_MESSAGE
    console.log('[MessageList] Binding message handler to channel:', userChannel.name, {
      eventName,
      subscriptionState,
      channelId,
      boundEvents: Object.keys(userChannel.callbacks || {}),
      subscribed: userChannel.subscribed
    })

    // Add a debug handler to log all events
    userChannel.bind('pusher:subscription_succeeded', () => {
      console.log('[MessageList] Channel subscription succeeded')
    })

    userChannel.bind_global((event: string, data: any) => {
      console.log('[MessageList] Channel received event:', {
        event,
        data,
        channelName: userChannel.name,
        boundEvents: Object.keys(userChannel.callbacks || {})
      })
    })

    // Bind the message handler
    userChannel.bind(eventName, handleNewMessage)

    return () => {
      console.log('[MessageList] Cleaning up Pusher bindings')
      if (userChannel) {
        userChannel.unbind(eventName, handleNewMessage)
      }
    }
  }, [channelId, userChannel, user?.id, variant, handleNewMessage, subscriptionState])

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