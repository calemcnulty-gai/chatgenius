'use client'

import { UserButton } from '@clerk/nextjs'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { useState } from 'react'

type WorkspaceLayoutClientProps = {
  children: React.ReactNode
  sidebarContent: React.ReactNode
}

export default function WorkspaceLayoutClient({ children, sidebarContent }: WorkspaceLayoutClientProps) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 overflow-y-auto bg-gray-900 text-gray-100">
        {sidebarContent}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
} 