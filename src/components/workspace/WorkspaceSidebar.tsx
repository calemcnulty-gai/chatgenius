import ChannelList from './ChannelList'
import { Channel } from '@/types'

type WorkspaceSidebarProps = {
  workspace: {
    id: string
    name: string
  }
  channels: Channel[]
}

export default function WorkspaceSidebar({ workspace, channels }: WorkspaceSidebarProps) {
  return (
    <div className="flex h-full flex-col bg-gray-900">
      <div className="flex h-12 items-center border-b border-gray-800 bg-gray-900 px-4">
        <h1 className="font-semibold text-white">{workspace.name}</h1>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-2">
        <ChannelList channels={channels} />
      </div>
    </div>
  )
} 