'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface Attachment {
  filename: string
  url: string
}

interface MessageAttachmentsProps {
  messageId: string
  className?: string
}

export function MessageAttachments({ messageId, className }: MessageAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const response = await fetch(`/api/messages/${messageId}/attachments`)
        if (!response.ok) {
          throw new Error('Failed to fetch attachments')
        }
        const data = await response.json()
        setAttachments(data.files || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attachments')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttachments()
  }, [messageId])

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-gray-700/20 rounded-md" />
  }

  if (error) {
    return <div className="text-red-500 text-sm">Error loading attachments: {error}</div>
  }

  if (attachments.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.filename)

          if (isImage) {
            return (
              <div key={attachment.filename} className="relative group">
                <Image
                  src={attachment.url}
                  alt={attachment.filename}
                  width={200}
                  height={200}
                  className="rounded-md max-w-[200px] max-h-[200px] object-cover"
                />
                <a
                  href={attachment.url}
                  download
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <ArrowDownTrayIcon className="h-6 w-6 text-white" />
                </a>
              </div>
            )
          }

          return (
            <a
              key={attachment.filename}
              href={attachment.url}
              download
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-md text-sm text-white transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {attachment.filename.split('/').pop()}
            </a>
          )
        })}
      </div>
    </div>
  )
} 