'use client'

import { useState } from 'react'
import { User } from '@/types/user'
import { ProfileModal } from '../profile/ProfileModal'

interface UserAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg'
}

export function UserAvatar({ user, size = 'md', onClick }: UserAvatarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent click from bubbling up
    if (onClick) {
      onClick()
    } else {
      setIsProfileOpen(true)
    }
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        {user.profileImage ? (
          <img
            src={user.profileImage}
            alt={`${user.name}'s profile`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
        />
      )}
    </>
  )
} 