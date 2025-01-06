'use client'

import React from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import CreateWorkspace from '@/components/workspace/CreateWorkspace'

export default function Home() {
  const { user } = useUser();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold">ChatGenius</h1>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
        
        {/* Chat list */}
        <div className="space-y-2">
          <button className="w-full text-left p-2 hover:bg-gray-700 rounded">
            + New Chat
          </button>
          {/* Chat history will go here */}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col">
        <CreateWorkspace />
      </main>
    </div>
  )
} 