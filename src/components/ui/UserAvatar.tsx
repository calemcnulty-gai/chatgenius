'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/types/user'
import { ProfileModal } from '../profile/ProfileModal'
import { ProfileEditModal } from '../profile/ProfileEditModal'
import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { useUserProfile } from '@/contexts/user/UserProfileContext'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
  showMenu?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg'
}

export function UserAvatar({ user, size = 'md', onClick, className, showMenu = false }: UserAvatarProps) {
  const router = useRouter()
  const { user: currentUser, isLoading: authLoading } = useUserAuth()
  const { isUpdating } = useUserProfile()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const isCurrentUser = currentUser?.id === user.id
  const isLoading = authLoading || isUpdating

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent click from bubbling up
    if (onClick) {
      onClick()
    } else if (!isLoading) {
      if (showMenu && isCurrentUser) {
        setIsMenuOpen(!isMenuOpen)
      } else {
        setIsProfileOpen(true)
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
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
        {((user?.displayName || user?.name || '?').charAt(0) || '?').toUpperCase()}
      </div>
    )
  }

  return (
    <div className="relative">
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

      {isMenuOpen && showMenu && isCurrentUser && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            <button
              onClick={() => {
                setIsMenuOpen(false)
                setIsProfileOpen(true)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Profile Settings
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

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
    </div>
  )
} 