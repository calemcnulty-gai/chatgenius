'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { HashtagIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Channel } from '@/types'
import Modal from '@/components/ui/Modal'
import CreateChannel from './CreateChannel'

type ChannelListProps = {
  channels: Channel[]
}

export default function ChannelList({ channels }: ChannelListProps) {
  const params = useParams()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold text-gray-400">Channels</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-gray-400 hover:text-gray-200"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1 px-1">
        {channels.map((channel) => (
          <Link
            key={channel.id}
            href={`/workspace/${params.workspaceSlug}/channel/${channel.slug}`}
            className={`
              flex items-center gap-x-2 rounded-md px-2 py-1.5 text-sm
              ${channel.slug === params.channelSlug
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <HashtagIcon className="h-4 w-4" />
            {channel.name}
          </Link>
        ))}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Channel"
      >
        <CreateChannel
          workspaceId={params.id as string}
          onComplete={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  )
} 