'use client'

import { useState, useEffect, useRef } from 'react'
import { Message } from './Message'
import { useAuth } from '@clerk/nextjs'
import { usePusherChannel } from '@/contexts/PusherContext'
import { PusherEvent } from '@/types/events'
import { User } from '@/types/user'

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
}

export function MessageList({ channelId }: MessageListProps) {
  const [messages, setMessages] = useState<MessageData[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const { userId: clerkUserId } = useAuth()
  const [userId, setUserId] = useState<string | null>(null)
  const { userChannel } = usePusherChannel()
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
      setMessages(Array.isArray(messageData) ? messageData : [])
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

  // Get database user ID on mount
  useEffect(() => {
    if (!clerkUserId) return

    fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        setUserId(data.id)
      })
      .catch(error => {
        console.error('Error syncing user:', error)
      })
  }, [clerkUserId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading || !userId) return

    console.log('[MessageList] Submitting new message:', {
      content: newMessage,
      channelId,
      userId
    })

    const tempId = crypto.randomUUID()
    const tempMessage: MessageData = {
      id: tempId,
      content: newMessage,
      sender: {
        id: userId,
        clerkId: clerkUserId!,
        name: '',  // Will be replaced by server response
        email: '',
        profileImage: null,
        displayName: null,
        title: null,
        timeZone: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentId: null,
      replyCount: 0,
      latestReplyAt: null,
      parentMessageId: null,
    }

    console.log('[MessageList] Adding temporary message:', tempMessage)
    setMessages(currentMessages => [...currentMessages, tempMessage])
    setNewMessage('')

    try {
      console.log('[MessageList] Sending message to server')
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          channelId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      console.log('[MessageList] Message sent successfully')
      // Server will send the real message through Pusher
      // We'll handle replacing the temp message in the Pusher event handler
    } catch (error) {
      console.error('[MessageList] Error sending message:', error)
      // Remove the temporary message on error
      setMessages(currentMessages => currentMessages.filter(m => m.id !== tempId))
    }
  }

  useEffect(() => {
    if (!userId || !userChannel) return

    console.log('[MessageList] Setting up Pusher binding for channel:', channelId)
    console.log('[MessageList] Current user ID:', userId)
    console.log('[MessageList] User channel:', userChannel.name)
    
    // Handle regular channel messages
    userChannel.bind(PusherEvent.NEW_CHANNEL_MESSAGE, (data: NewMessageEvent) => {
      console.log('[MessageList] Received channel message:', {
        event: PusherEvent.NEW_CHANNEL_MESSAGE,
        data,
        currentChannelId: channelId,
        matches: data.channelId === channelId,
        currentUserId: userId,
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
        currentUserId: userId,
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
          parentMessageId: data.parentId,
        }

        // Replace temporary message if it exists (for our own messages)
        const tempMessageIndex = currentMessages.findIndex(m => 
          m.content === newMessage.content && 
          m.sender.id === userId &&  // Use database user ID here
          m.id.includes('-')  // temp messages use UUID format
        )

        if (tempMessageIndex !== -1) {
          console.log('[MessageList] Replacing temporary message at index:', tempMessageIndex)
          const updatedMessages = [...currentMessages]
          updatedMessages[tempMessageIndex] = newMessage
          return updatedMessages
        }

        console.log('[MessageList] Adding new message:', newMessage)
        return [...currentMessages, newMessage]
      })
    }

    return () => {
      console.log('[MessageList] Cleaning up Pusher bindings')
      userChannel.unbind(PusherEvent.NEW_CHANNEL_MESSAGE)
      userChannel.unbind(PusherEvent.NEW_DIRECT_MESSAGE)
    }
  }, [userId, channelId, userChannel])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-400">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-400">No messages yet</div>
            </div>
          ) : (
            messages.map((message) => (
              <Message
                key={message.id}
                {...message}
                channelId={channelId}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-700 px-4 py-3">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Type a message..."
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  )
} 