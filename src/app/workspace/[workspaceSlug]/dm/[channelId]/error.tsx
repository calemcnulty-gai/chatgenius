'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DMChannelError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('DM Channel Error:', error)
  }, [error])

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="inline-block rounded-full bg-red-100 p-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">
          Something went wrong
        </h3>
        <p className="mt-2 text-sm text-gray-400">
          {error.message || 'Failed to load the conversation'}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Try again
        </button>
      </div>
    </div>
  )
} 