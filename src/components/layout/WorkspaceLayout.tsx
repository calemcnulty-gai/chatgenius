'use client'

import { UserButton } from '@clerk/nextjs'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useState } from 'react'

type WorkspaceLayoutProps = {
  children: React.ReactNode
  sidebarContent: React.ReactNode
}

export default function WorkspaceLayout({ children, sidebarContent }: WorkspaceLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 z-50 flex w-64 flex-col bg-gray-900 transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between border-b border-gray-800 px-4">
          <UserButton />
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <span className="sr-only">Close sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {sidebarContent}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex h-14 items-center border-b border-gray-200 bg-white px-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 lg:hidden"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  )
} 