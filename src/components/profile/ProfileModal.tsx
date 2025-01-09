import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { User } from '@/types/user'
import { formatDistanceToNow } from 'date-fns'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown'
    
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown'
      }
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'Unknown'
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name || 'User profile'}
                        className="h-16 w-16 rounded-full"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-medium text-blue-600">
                        {(user.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                        {user.name || 'Unknown User'}
                      </Dialog.Title>
                      {user.displayName && (
                        <p className="mt-1 text-sm text-gray-400">{user.displayName}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {user.title && (
                    <div>
                      <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">Title</h4>
                      <p className="mt-1 text-sm text-gray-300">{user.title}</p>
                    </div>
                  )}

                  {user.timeZone && (
                    <div>
                      <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">Time zone</h4>
                      <p className="mt-1 text-sm text-gray-300">{user.timeZone}</p>
                    </div>
                  )}

                  {user.email && (
                    <div>
                      <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">Email</h4>
                      <p className="mt-1 text-sm text-gray-300">{user.email}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500">Member since</h4>
                    <p className="mt-1 text-sm text-gray-300">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 