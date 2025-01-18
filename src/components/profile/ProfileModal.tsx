'use client'

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { User } from '@/types/user'
import { useUserAuth } from '@/contexts/user/UserAuthContext'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User  // Keep this prop as we need it for viewing other users' profiles
}

export function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const { user: currentUser } = useUserAuth()
  const isCurrentUser = currentUser?.id === user.id

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
                <div className="flex items-start space-x-4">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={`${user.displayName || user.name}'s profile`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-blue-100 text-2xl font-medium text-blue-600">
                        {(user.displayName || user.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-white">
                      {user.displayName || user.name}
                    </Dialog.Title>
                    {user.displayName && (
                      <p className="mt-1 text-sm text-gray-400">{user.name}</p>
                    )}
                    {user.title && (
                      <p className="mt-2 text-sm text-gray-300">{user.title}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {user.timeZone && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-300">Time zone</h4>
                      <p className="mt-1 text-sm text-gray-400">{user.timeZone}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 