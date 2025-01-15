'use client'

import { useState, useCallback, useEffect } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/solid'
import { cn } from '@/lib/utils'
import { Combobox } from '@headlessui/react'

interface AIUser {
  id: string
  clerk_id: string
  name: string
  display_name: string | null
  profile_image: string | null
  title: string | null
}

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
  const [isDragging, setIsDragging] = useState(false)
  const [showAIDropdown, setShowAIDropdown] = useState(false)
  const [aiUsers, setAIUsers] = useState<AIUser[]>([])
  const [selectedAIUser, setSelectedAIUser] = useState<AIUser | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    // When /ai is typed, fetch AI users
    if (content.startsWith('/ai') && !aiUsers.length) {
      console.log('Fetching AI users...')
      fetch('/api/ai-users')
        .then(res => {
          console.log('AI users response:', res)
          return res.json()
        })
        .then(users => {
          console.log('AI users fetched:', users)
          setAIUsers(users)
        })
        .catch(error => {
          console.error('Error fetching AI users:', error)
        })
    }

    // Show dropdown when /ai is typed
    const shouldShowDropdown = content.startsWith('/ai ')
    console.log('Should show dropdown:', shouldShowDropdown)
    setShowAIDropdown(shouldShowDropdown)

    // Hide dropdown when /ai is removed
    if (!content.startsWith('/ai')) {
      setShowAIDropdown(false)
      setSelectedAIUser(null)
    }
  }, [content])

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
  }, [channelId, content, parentMessageId, onMessageSent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // If this is an /ai command with a selected user
      if (content.startsWith('/ai ') && selectedAIUser) {
        const aiCommand = {
          aiUser: selectedAIUser.clerk_id,
          query: content.slice(content.indexOf(' ', 4) + 1) // Remove '/ai @username '
        }

        const response = await fetch('/api/rag', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(aiCommand),
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
            content: result.response,
            channelId,
            parentMessageId,
            aiUserId: selectedAIUser.id
          }),
        })

        if (!messageResponse.ok) {
          throw new Error('Failed to send AI response message')
        }

        setContent('')
        setSelectedAIUser(null)
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

  const filteredAIUsers = query === ''
    ? aiUsers
    : aiUsers.filter((user) => {
        return user.name.toLowerCase().includes(query.toLowerCase()) ||
               (user.display_name?.toLowerCase().includes(query.toLowerCase()))
      })

  return (
    <form 
      onSubmit={handleSubmit} 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-t border-gray-700 bg-gray-900 p-4 relative",
        isDragging && "bg-blue-900/20",
        className
      )}
    >
      {isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-500/10 rounded-lg flex items-center justify-center">
          <div className="text-blue-500 font-medium">Drop files to share</div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (showAIDropdown) {
                setQuery(e.target.value.slice(4)) // Remove '/ai ' prefix for filtering
              }
            }}
            placeholder={isDragging ? 'Drop files here...' : placeholder}
            className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showAIDropdown && (
            <div className="absolute w-full mt-1 bg-gray-800 rounded-md shadow-lg z-50">
              <Combobox value={selectedAIUser} onChange={(user: AIUser) => {
                console.log('Selected user:', user)
                setSelectedAIUser(user)
                // Insert the user's name into the input at cursor position
                const beforeAI = content.slice(0, content.indexOf('/ai') + 3)
                const afterAI = content.slice(content.indexOf('/ai') + 3)
                setContent(`${beforeAI} @${user.display_name || user.name}${afterAI}`)
              }}>
                <div className="relative">
                  <Combobox.Options static className="absolute w-full py-1 overflow-auto text-base bg-gray-800 rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredAIUsers.length === 0 ? (
                      <div className="cursor-default select-none relative py-2 px-4 text-gray-400">
                        No AI users found.
                      </div>
                    ) : (
                      filteredAIUsers.map((user) => (
                        <Combobox.Option
                          key={user.id}
                          value={user}
                          className={({ active }) =>
                            cn(
                              'cursor-default select-none relative py-2 px-4',
                              active ? 'text-white bg-blue-600' : 'text-gray-300'
                            )
                          }
                        >
                          {({ selected, active }) => (
                            <div className="flex items-center">
                              {user.profile_image && (
                                <img
                                  src={user.profile_image}
                                  alt=""
                                  className="h-6 w-6 rounded-full mr-2"
                                />
                              )}
                              <div>
                                <div className="flex items-center">
                                  <span className={cn('block truncate', selected && 'font-semibold')}>
                                    {user.display_name || user.name}
                                  </span>
                                </div>
                                {user.title && (
                                  <span className={cn(
                                    'block truncate text-sm',
                                    active ? 'text-blue-200' : 'text-gray-500'
                                  )}>
                                    {user.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
          )}
        </div>
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