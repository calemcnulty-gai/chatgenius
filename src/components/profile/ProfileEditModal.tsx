'use client'

import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { User } from '@/types/user'
import { timezones } from '@/lib/timezones'
import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { useUserProfile } from '@/contexts/user/UserProfileContext'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { user } = useUserAuth()
  const { updateProfile, isUpdating, error, clearError } = useUserProfile()
  
  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [title, setTitle] = useState('')
  const [timeZone, setTimeZone] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFullName(user.name)
      setDisplayName(user.displayName || '')
      setTitle(user.title || '')
      setTimeZone(user.timeZone || '')
      setProfileImage(user.profileImage)
    }
  }, [user])

  // Clear any context errors when modal is opened
  useEffect(() => {
    if (isOpen) {
      clearError()
    }
  }, [isOpen, clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await updateProfile({
        name: fullName,
        displayName,
        title,
        timeZone,
        profileImage,
      })
      onClose()
    } catch (err) {
      // Error is handled by context
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploadError(null)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const { url } = await response.json()
      setProfileImage(url)
    } catch (err) {
      setUploadError('Failed to upload image. Please try again.')
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
                <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-white">
                  Edit your profile
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-6 flex-1">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                          Full name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                          disabled={isUpdating}
                        />
                      </div>

                      <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-300">
                          Display name
                        </label>
                        <input
                          type="text"
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                          disabled={isUpdating}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          This could be your first name, or a nickname — however you'd like people to refer to you.
                        </p>
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col items-center">
                      <p className="text-sm font-medium text-gray-300 mb-2">Profile photo</p>
                      <div className="relative flex flex-col items-center">
                        <div className="h-24 w-24 rounded-lg bg-gray-800 overflow-hidden">
                          {profileImage ? (
                            <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-500">
                              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          className="mt-2 text-sm text-blue-500 hover:text-blue-400"
                          disabled={isUpdating}
                        >
                          Upload Photo
                        </button>
                        <input
                          type="file"
                          id="photo-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUpdating}
                        />
                        {profileImage && (
                          <button
                            type="button"
                            onClick={() => setProfileImage(null)}
                            className="mt-1 text-sm text-gray-500 hover:text-gray-400"
                            disabled={isUpdating}
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                      placeholder="Title"
                      disabled={isUpdating}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Let people know what you do at ChatGenius.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="timeZone" className="block text-sm font-medium text-gray-300">
                      Time zone
                    </label>
                    <select
                      id="timeZone"
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                      disabled={isUpdating}
                    >
                      <option value="">Select a timezone</option>
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(error || uploadError) && (
                    <p className="text-sm text-red-500">
                      {error || uploadError}
                    </p>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isUpdating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 