import { User } from '@/types/user'
import { formatDistanceToNow } from 'date-fns'
import { Timestamp, parseTimestamp } from '@/types/timestamp'

interface ProfileViewProps {
  user: User
  onClose: () => void
}

export function ProfileView({ user, onClose }: ProfileViewProps) {
  // Format the timestamp using our standardized timestamp handling
  const formatDate = (timestamp: Timestamp) => {
    try {
      return formatDistanceToNow(parseTimestamp(timestamp), { addSuffix: true })
    } catch (error) {
      return 'Unknown'
    }
  }

  return (
    <div className="p-4 bg-gray-900 text-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          {user.profileImage && (
            <img
              src={user.profileImage}
              alt={user.displayName || user.name}
              className="h-12 w-12 rounded-full"
            />
          )}
          <div>
            <h2 className="text-lg font-medium">{user.displayName || user.name}</h2>
            {user.displayName && user.displayName !== user.name && (
              <p className="text-sm text-gray-400">{user.name}</p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-300"
        >
          <span className="sr-only">Close</span>
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {user.title && (
          <div>
            <h3 className="text-xs font-medium uppercase text-gray-500">Title</h3>
            <p className="mt-1 text-sm">{user.title}</p>
          </div>
        )}

        {user.timeZone && (
          <div>
            <h3 className="text-xs font-medium uppercase text-gray-500">Time zone</h3>
            <p className="mt-1 text-sm">{user.timeZone}</p>
          </div>
        )}

        {user.email && (
          <div>
            <h3 className="text-xs font-medium uppercase text-gray-500">Email</h3>
            <p className="mt-1 text-sm">{user.email}</p>
          </div>
        )}

        <div>
          <h3 className="text-xs font-medium uppercase text-gray-500">Member since</h3>
          <p className="mt-1 text-sm">{formatDate(user.createdAt)}</p>
        </div>
      </div>
    </div>
  )
} 