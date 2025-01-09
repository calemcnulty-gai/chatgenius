'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { User } from '@/types/user'
import { ProfileModal } from '../profile/ProfileModal'
import { ProfileEditModal } from '../profile/ProfileEditModal'
import { useUser } from '@/contexts/UserContext'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg'
}

export function UserAvatar({ user, size = 'md', onClick, className }: UserAvatarProps) {
  const { userId } = useAuth()
  const { user: currentUser, isLoading } = useUser()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const isCurrentUser = userId === user.clerkId

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent click from bubbling up
    if (onClick) {
      onClick()
    } else if (!isLoading) {
      setIsProfileOpen(true)
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const renderAvatar = () => {
    if (isLoading) {
      return (
        <div 
          data-testid="avatar-loading"
          className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse" 
        />
      )
    }

    if (user.profileImage && !imageError) {
      return (
        <img
          src={user.profileImage}
          alt={`${user.displayName || user.name}'s profile`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      )
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium">
        {(user.displayName || user.name).charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <>
      <div
        data-testid="avatar-container"
        onClick={handleClick}
        className={cn(
          'rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          sizeClasses[size],
          isLoading && 'opacity-75 cursor-wait',
          className
        )}
      >
        {renderAvatar()}
      </div>

      {isProfileOpen && (
        isCurrentUser ? (
          <ProfileEditModal
            data-testid="profile-edit-modal"
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        ) : (
          <ProfileModal
            data-testid="profile-modal"
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
          />
        )
      )}
    </>
  )
} 