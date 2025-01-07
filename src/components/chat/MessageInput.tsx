'use client'

import { useState } from 'react'

type MessageInputProps = {
  channelId: string
  parentMessageId?: string
  onMessageSent: () => void
  placeholder?: string
}

export function MessageInput({ 
  channelId, 
  parentMessageId,
  onMessageSent,
  placeholder = 'Type a message...',
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          content: content.trim(),
          parentMessageId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setContent('')
      onMessageSent()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="relative">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>
    </form>
  )
} 