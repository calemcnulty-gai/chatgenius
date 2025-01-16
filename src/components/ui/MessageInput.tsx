'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import { Combobox } from '@headlessui/react'
import { UserAvatar } from './UserAvatar'
import { UserDisplay } from './UserDisplay'
import { User } from '@/types/user'

interface MessageInputProps {
  channelId: string
  variant?: 'channel' | 'dm'
  parentMessageId?: string
  placeholder?: string
  className?: string
  onMessageSent?: () => void
}

interface MentionState {
  isOpen: boolean
  startPosition: number
  query: string
}

export function MessageInput({
  channelId,
  variant = 'channel',
  parentMessageId,
  placeholder = 'Type a message...',
  className,
  onMessageSent
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [mentionState, setMentionState] = useState<MentionState>({
    isOpen: false,
    startPosition: 0,
    query: ''
  })
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch workspace users when component mounts
  useEffect(() => {
    if (variant === 'channel') {
      const workspaceSlug = window.location.pathname.split('/')[2]
      fetch(`/api/workspaces/${workspaceSlug}/users`)
        .then(res => res.json())
        .then(data => {
          setUsers(data.users)
        })
        .catch(error => {
          console.error('Error fetching users:', error)
        })
    }
  }, [variant])

  const insertMention = useCallback((user: User) => {
    if (!inputRef.current) return

    const beforeMention = content.slice(0, mentionState.startPosition)
    const afterMention = content.slice(inputRef.current.selectionStart || mentionState.startPosition)
    const newContent = `${beforeMention}@${user.name} ${afterMention}`
    
    setContent(newContent)
    setMentionState({ isOpen: false, startPosition: 0, query: '' })
    
    // Set cursor position after the inserted mention
    const newCursorPosition = mentionState.startPosition + user.name.length + 2 // +2 for @ and space
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        inputRef.current.focus()
      }
    }, 0)
  }, [content, mentionState])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle mention suggestions
    if (mentionState.isOpen) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionState({ isOpen: false, startPosition: 0, query: '' })
      }
      return
    }

    // Start mention flow when @ is typed
    if (e.key === '@' && variant === 'channel') {
      const position = e.currentTarget.selectionStart || 0
      setMentionState({
        isOpen: true,
        startPosition: position,
        query: ''
      })
    }

    // Close mention suggestions if we type a space
    if (e.key === ' ' && mentionState.isOpen) {
      setMentionState({ isOpen: false, startPosition: 0, query: '' })
    }
  }, [mentionState, variant])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = e.target.value
    setContent(newContent)

    // Update mention query if mention flow is active
    if (mentionState.isOpen) {
      const currentPosition = e.target.selectionStart || mentionState.startPosition
      const textFromMentionStart = newContent.slice(mentionState.startPosition, currentPosition)
      
      // If we've typed a space or deleted the @, close the mention flow
      if (textFromMentionStart.includes(' ') || !textFromMentionStart.startsWith('@')) {
        setMentionState({ isOpen: false, startPosition: 0, query: '' })
      } else {
        setMentionState({
          ...mentionState,
          query: textFromMentionStart.slice(1) // Remove @ from query
        })
      }
    }

    // Emit typing event for DMs
    if (variant === 'dm') {
      fetch(`/api/channels/${channelId}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(error => {
        console.error('Error sending typing event:', error)
      })
    }
  }, [mentionState, variant, channelId])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    setIsSubmitting(true)
    try {
      // Create a new message first
      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content || 'Shared a file',
          channelId,
          type: variant,
          parentMessageId
        }),
      })

      if (!messageResponse.ok) {
        throw new Error('Failed to create message')
      }

      const message = await messageResponse.json()

      // Upload each file
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch(`/api/messages/${message.id}/attachments`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload file ${file.name}`)
        }
      }

      setContent('')
      onMessageSent?.()
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [channelId, content, parentMessageId, variant, onMessageSent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const messageContent = content.trim()
      
      // Validate message content for DMs
      if (variant === 'dm' && messageContent.length > 10000) {
        throw new Error('Message is too long. DM messages must be under 10,000 characters.')
      }

      // Send the message
      const messagePayload = {
        content: messageContent,
        channelId,
        type: variant,
        parentMessageId
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send message')
      }

      setContent('')
      onMessageSent?.()
    } catch (error) {
      console.error('Error sending message:', error)
      if (error instanceof Error) {
        alert(error.message)
      } else {
        alert('Failed to send message')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredUsers = mentionState.query === ''
    ? users
    : users.filter(user => {
        const searchTerms = [
          user.name.toLowerCase(),
          user.displayName?.toLowerCase() || '',
          user.email.toLowerCase()
        ]
        return searchTerms.some(term => term.includes(mentionState.query.toLowerCase()))
      })

  return (
    <form 
      onSubmit={handleSubmit} 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-t border-gray-700 bg-gray-800 p-4",
        isDragging && "bg-blue-900/20",
        className
      )}
    >
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-500/10 rounded-lg flex items-center justify-center">
          <div className="text-blue-500 font-medium">Drop files to share</div>
        </div>
      )}

      <div className="relative">
        {mentionState.isOpen && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-60 overflow-auto py-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-800 text-left"
                >
                  <UserAvatar user={user} size="sm" />
                  <UserDisplay 
                    user={user}
                    variant="text-with-status"
                    className="flex-1"
                  />
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-400">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="text-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </form>
  )
} 