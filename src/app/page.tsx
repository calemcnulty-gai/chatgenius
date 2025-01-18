'use client'

import { SignInButton } from "@clerk/nextjs"
import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import CreateWorkspace from '@/components/workspace/CreateWorkspace'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import Link from 'next/link'

export default function Home() {
  const { user, isLoading } = useUserAuth()
  const { workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-lg text-gray-400">Loading...</div>
    </div>
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black">
        <h1 className="text-4xl font-bold text-white">Welcome to ChatGenius</h1>
        <p className="mt-4 text-lg text-gray-400">Sign in to get started</p>
        <SignInButton mode="modal">
          <button className="mt-8 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-medium text-white hover:bg-indigo-500 transition-colors">
            Sign In
          </button>
        </SignInButton>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Your Workspaces</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            New Workspace
          </button>
        </div>

        <div className="mt-6">
          {isLoadingWorkspaces ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-800 p-8">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-white">No workspaces</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Get started by creating a new workspace
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  New Workspace
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/workspace/${workspace.slug}`}
                  className="block rounded-lg border border-gray-800 bg-gray-900 p-6 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all"
                >
                  <h3 className="text-lg font-semibold text-white">{workspace.name}</h3>
                  {workspace.description && (
                    <p className="mt-2 text-sm text-gray-400">{workspace.description}</p>
                  )}
                  <div className="mt-4 text-xs font-medium text-gray-500">
                    Role: {workspace.role}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCreateModalOpen(false)}>
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
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                      Create New Workspace
                    </Dialog.Title>
                    <button
                      onClick={() => setIsCreateModalOpen(false)}
                      className="rounded-md text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4">
                    <CreateWorkspace onComplete={() => setIsCreateModalOpen(false)} />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
} 