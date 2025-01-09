'use client'

import { useState, FormEvent } from 'react'

type MessageInputProps = {
  channelId: string
  parentMessageId?: string
  onMessageSent: () => void
  placeholder?: string
  className?: string
}

export function MessageInput({ 
  channelId, 
  parentMessageId,
  onMessageSent,
  placeholder = 'Type a message...',
  className = '',
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
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
    <form onSubmit={handleSubmit} className={`border-t border-gray-700/50 bg-gray-800 px-4 py-3 ${className}`}>
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md bg-gray-700 px-3 py-2 text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        disabled={isSubmitting}
      />
    </form>
  )
} 