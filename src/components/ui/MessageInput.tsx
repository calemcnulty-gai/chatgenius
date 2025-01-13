'use client'

import { useState } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'

interface MessageInputProps {
  channelId: string
  parentMessageId?: string
  placeholder?: string
  className?: string
  onMessageSent?: () => void
}

export function MessageInput({
  channelId,
  parentMessageId,
  placeholder = 'Type a message...',
  className,
  onMessageSent
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // Check if this is an /ai command
      if (content.trim().startsWith('/ai ')) {
        const query = content.trim().slice(4) // Remove '/ai ' prefix
        const response = await fetch('/api/rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        })

        if (!response.ok) {
          throw new Error('Failed to process AI command')
        }

        const result = await response.json()
        
        // Send the AI response as a message
        const messageResponse = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `Query: ${query}\n\nResponse: ${result.response}\n\nSources:\n${result.context.map((ctx: any) => `- ${ctx.source}: ${ctx.content}`).join('\n')}`,
            channelId,
            parentMessageId
          }),
        })

        if (!messageResponse.ok) {
          throw new Error('Failed to send AI response message')
        }

        setContent('')
        onMessageSent?.()
        return
      }

      // If this is a thread reply, use the thread endpoint
      const endpoint = parentMessageId 
        ? `/api/messages/${parentMessageId}/replies`
        : '/api/messages'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          channelId,
          parentMessageId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setContent('')
      onMessageSent?.()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("border-t border-gray-700 bg-gray-900 p-4", className)}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-gray-800 text-white placeholder-gray-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="bg-blue-600 text-white rounded-md p-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </form>
  )
} 