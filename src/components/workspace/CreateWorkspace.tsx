'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserAuth } from '@/contexts/user/UserAuthContext'

type CreateWorkspaceProps = {
  onComplete?: () => void
}

export default function CreateWorkspace({ onComplete }: CreateWorkspaceProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user } = useUserAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    try {
      console.log('Submitting workspace creation:', { name, description })
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
        }),
      })

      console.log('Response status:', response.status)
      const text = await response.text()
      console.log('Response text:', text)

      if (!response.ok) {
        throw new Error(`Failed to create workspace: ${text}`)
      }

      const workspace = JSON.parse(text)
      onComplete?.()
      router.push(`/workspace/${workspace.slug}`)
    } catch (error) {
      console.error('Error creating workspace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-200">
          Workspace Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-md border-0 bg-gray-900 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-200">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="block w-full rounded-md border-0 bg-gray-900 py-1.5 text-white shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
          rows={3}
        />
      </div>
      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto"
        >
          {isLoading ? 'Creating...' : 'Create Workspace'}
        </button>
        <button
          type="button"
          onClick={() => onComplete?.()}
          className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 shadow-sm ring-1 ring-inset ring-gray-700 hover:bg-gray-700 sm:mt-0 sm:w-auto"
        >
          Cancel
        </button>
      </div>
    </form>
  )
} 