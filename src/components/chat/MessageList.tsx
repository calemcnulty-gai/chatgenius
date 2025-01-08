'use client'

import { useEffect, useState } from 'react'
import { Message } from './Message'
import { MessageInput } from './MessageInput'
import { getPusherClient } from '@/lib/pusher'

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
  const [messages, setMessages] = useState<MessageData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()

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
    const channelName = `channel-${channelId}`
    console.log(`[MessageList] Subscribing to channel: ${channelName}`)

    // Get the Pusher client
    const pusherClient = getPusherClient()

    // Subscribe if not already subscribed
    const channel = pusherClient.subscribe(channelName)

    // Wait for subscription to be ready
    const handleSubscriptionSucceeded = () => {
      console.log(`[MessageList] Successfully subscribed to ${channelName}`)
      
      // Listen for new messages
      channel.bind('new-message', (data: any) => {
        console.log(`[MessageList] Received new message:`, data)
        
        // Only add the message if it's not a reply or if we're showing replies
        if (!data.parentMessageId) {
          // For DMs, check if the message belongs to this channel
          // For regular channels, check if it's a channel message for this channel
          const isDMForThisChannel = data.isDM && data.dmChannelId === channelId
          const isChannelMessageForThisChannel = data.isChannel && data.channelId === channelId

          if (isDMForThisChannel || isChannelMessageForThisChannel) {
            setMessages((currentMessages) => {
              // Avoid duplicate messages
              if (currentMessages.some(msg => msg.id === data.id)) {
                console.log(`[MessageList] Skipping duplicate message: ${data.id}`)
                return currentMessages;
              }
              console.log(`[MessageList] Adding new message: ${data.id}`)
              return [data, ...currentMessages];
            })
          }
        }
      })

      // Listen for thread updates
      channel.bind('thread-update', (data: any) => {
        console.log(`[MessageList] Received thread update:`, data)
        setMessages((currentMessages) => 
          currentMessages.map((message) =>
            message.id === data.messageId
              ? { 
                  ...message, 
                  replyCount: data.replyCount, 
                  latestReplyAt: data.latestReplyAt 
                }
              : message
          )
        )
      })
    }

    channel.bind('pusher:subscription_succeeded', handleSubscriptionSucceeded)

    // Handle subscription errors
    channel.bind('pusher:subscription_error', (error: any) => {
      console.error(`[MessageList] Subscription error for ${channelName}:`, error)
    })

    // Cleanup
    return () => {
      console.log(`[MessageList] Cleaning up subscription to ${channelName}`)
      channel.unbind('pusher:subscription_succeeded', handleSubscriptionSucceeded)
      channel.unbind_all()
      pusherClient.unsubscribe(channelName)
    }
  }, [channelId])

  const loadMore = () => {
    if (hasMore && nextCursor) {
      fetchMessages(nextCursor)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-500">Loading messages...</p>
        </div>
        <div className="shrink-0">
          <MessageInput channelId={channelId} onMessageSent={() => fetchMessages()} />
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
          <div className="flex flex-col-reverse">
            {messages.map((message) => (
              <Message
                key={message.id}
                id={message.id}
                content={message.content}
                sender={message.sender}
                createdAt={message.createdAt}
                replyCount={message.replyCount}
                latestReplyAt={message.latestReplyAt}
                parentMessageId={message.parentMessageId}
                channelId={channelId}
              />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                className="mx-auto my-4 rounded-md bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
              >
                Load more messages
              </button>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0">
        <MessageInput channelId={channelId} onMessageSent={() => fetchMessages()} />
      </div>
    </div>
  )
} 