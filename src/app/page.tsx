'use client'

import { SignInButton } from "@clerk/nextjs"
import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import CreateWorkspace from '@/components/workspace/CreateWorkspace'
import Modal from '@/components/ui/Modal'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import Link from 'next/link'

export default function Home() {
  const { user, isLoaded } = useUser()
  const { workspaces, isLoading } = useWorkspaces()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  if (!isLoaded) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg text-gray-600">Loading...</div>
    </div>
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to ChatGenius</h1>
        <p className="mt-4 text-lg text-gray-600">Sign in to get started</p>
        <SignInButton mode="modal">
          <button className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-500">
            Sign In
          </button>
        </SignInButton>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Your Workspaces</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <PlusIcon className="h-5 w-5" />
            New Workspace
          </button>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : workspaces.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-900">No workspaces</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new workspace
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
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
                  className="block rounded-lg border border-gray-200 bg-white p-6 hover:border-blue-500 hover:ring-1 hover:ring-blue-500"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
                  {workspace.description && (
                    <p className="mt-2 text-sm text-gray-500">{workspace.description}</p>
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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Workspace"
      >
        <CreateWorkspace onComplete={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  )
} 