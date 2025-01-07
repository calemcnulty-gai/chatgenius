'use client'

import { MessageList } from '@/components/chat/MessageList'
import { ThreadPanel } from '@/components/chat/ThreadPanel'
import { useState, useEffect, useCallback } from 'react'

type Channel = {
  id: string
  name: string
  slug: string
  workspaceId: string
}

type Props = {
  channel: Channel
}

export function ChannelPageClient({ channel }: Props) {
  console.log('[Thread] ChannelPageClient mounting/rendering', { channelId: channel.id })
  
  const [activeThread, setActiveThread] = useState<string | null>(null)

  const handleOpenThread = useCallback((e: Event) => {
    const customEvent = e as CustomEvent
    console.log('[Thread] Received open-thread event:', {
      detail: customEvent.detail,
      currentTarget: customEvent.currentTarget,
      target: customEvent.target,
      eventPhase: customEvent.eventPhase,
      timeStamp: customEvent.timeStamp,
      type: customEvent.type
    })
    setActiveThread(customEvent.detail.messageId)
  }, [])

  // Set up event listener immediately
  useEffect(() => {
    console.log('[Thread] Setting up open-thread event listener')
    window.addEventListener('open-thread', handleOpenThread)
    console.log('[Thread] Event listener added')

    return () => {
      console.log('[Thread] Cleaning up open-thread event listener')
      window.removeEventListener('open-thread', handleOpenThread)
    }
  }, [handleOpenThread])

  // Track active thread changes
  useEffect(() => {
    console.log('[Thread] Active thread changed:', activeThread)
  }, [activeThread])

  return (
    <div className="flex h-full flex-col bg-gray-800">
      {/* Channel header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-700 bg-gray-800 px-4 py-3">
        <h1 className="text-lg font-medium text-white">#{channel.name}</h1>
      </div>

      {/* Messages area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <MessageList channelId={channel.id} />
        </div>
        {activeThread && (
          <ThreadPanel
            messageId={activeThread}
            channelId={channel.id}
            onClose={() => setActiveThread(null)}
          />
        )}
      </div>
    </div>
  )
} 