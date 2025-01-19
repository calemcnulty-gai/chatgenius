import { MessageListServer } from '@/server-components/chat/MessageListServer'

interface DMPageProps {
  params: {
    channelId: string
  }
}

export default function DMPage({ params }: DMPageProps) {
  return (
    <div className="flex flex-col h-full">
      <MessageListServer channelId={params.channelId} variant="dm" />
    </div>
  )
} 