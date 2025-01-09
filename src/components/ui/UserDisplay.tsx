'use client'

import { useState } from 'react'
import { User } from '@/types/user'
import { cn } from '@/lib/utils'
import { useUser } from '@/contexts/UserContext'

interface UserDisplayProps {
  user: User
  variant?: 'text' | 'text-with-status' | 'full'
  className?: string
  showLoadingState?: boolean
}

export function UserDisplay({ 
  user, 
  variant = 'text', 
  className = '',
  showLoadingState = true
}: UserDisplayProps) {
  const { isLoading } = useUser()
  const [imageError, setImageError] = useState(false)
  const displayName = user.displayName || user.name

  const handleImageError = () => {
    setImageError(true)
  }

  if (isLoading && showLoadingState) {
    if (variant === 'text') {
      return (
        <span className={cn('bg-gray-200 animate-pulse rounded h-5 w-24', className)} />
      )
    }

    if (variant === 'text-with-status') {
      return (
        <span className={cn('flex items-center gap-2', className)}>
          <span className="bg-gray-200 animate-pulse rounded h-5 w-24" />
          <span className="h-2 w-2 rounded-full bg-gray-200 animate-pulse" />
        </span>
      )
    }

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
        <div className="space-y-2">
          <div className="bg-gray-200 animate-pulse rounded h-5 w-24" />
          <div className="bg-gray-200 animate-pulse rounded h-4 w-20" />
        </div>
        <span className="h-2 w-2 rounded-full bg-gray-200 animate-pulse" />
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <span className={className}>
        {displayName}
      </span>
    )
  }

  if (variant === 'text-with-status') {
    return (
      <span className={cn('flex items-center gap-2', className)}>
        {displayName}
        <span 
          className={cn(
            'h-2 w-2 rounded-full',
            user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
          )}
        />
      </span>
    )
  }

  // Full variant with all user info
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {user.profileImage && !imageError ? (
        <img 
          src={user.profileImage} 
          alt={displayName}
          className="h-8 w-8 rounded-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-white">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-medium text-white">
          {displayName}
        </span>
        {user.title && (
          <span className="text-sm text-gray-400">
            {user.title}
          </span>
        )}
      </div>
      <span 
        className={cn(
          'h-2 w-2 rounded-full',
          user.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
        )}
      />
    </div>
  )
} 