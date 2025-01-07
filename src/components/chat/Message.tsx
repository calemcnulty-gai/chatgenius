import { UserAvatar } from '@/components/ui/UserAvatar'
import { formatRelativeTime } from '@/lib/utils'

type MessageProps = {
  content: string
  sender: {
    id: string
    name: string
    profileImage: string | null
  }
  createdAt: string
}

export function Message({ content, sender, createdAt }: MessageProps) {
  return (
    <div className="group flex items-start gap-x-3 py-2 hover:bg-gray-50">
      <UserAvatar
        name={sender.name}
        image={sender.profileImage}
        className="h-9 w-9"
      />
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-x-2">
          <span className="font-medium text-gray-900">{sender.name}</span>
          <span className="text-xs text-gray-500">
            {formatRelativeTime(new Date(createdAt))}
          </span>
        </div>
        <p className="text-sm text-gray-900">{content}</p>
      </div>
    </div>
  )
} 