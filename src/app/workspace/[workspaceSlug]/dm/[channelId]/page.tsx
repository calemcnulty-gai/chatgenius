'use client'

import { useState, useEffect } from 'react'
import { MessageList } from '@/components/chat/MessageList'
import { ThreadPanel } from '@/components/chat/ThreadPanel'

interface DMChannelPageProps {
  params: {
    workspaceSlug: string
    channelId: string
  }
}

export default function DMChannelPage({ params }: DMChannelPageProps) {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

  // Listen for thread open events
  useEffect(() => {
    const handleThreadOpen = (event: CustomEvent<{ messageId: string }>) => {
      setActiveThreadId(event.detail.messageId)
    }

    window.addEventListener('open-thread' as any, handleThreadOpen)
    return () => {
      window.removeEventListener('open-thread' as any, handleThreadOpen)
    }
  }, [])

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-0">
          <MessageList channelId={params.channelId} variant="dm" />
        </div>
      </div>
      {activeThreadId && (
        <ThreadPanel
          channelId={params.channelId}
          messageId={activeThreadId}
          onClose={() => setActiveThreadId(null)}
        />
      )}
    </div>
  )
} 