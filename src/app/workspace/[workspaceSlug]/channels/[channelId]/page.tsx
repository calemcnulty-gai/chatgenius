import { MessageListServer } from '@/server-components/chat/MessageListServer'

interface ChannelPageProps {
  params: {
    channelId: string
  }
}

export default function ChannelPage({ params }: ChannelPageProps) {
  return (
    <div className="flex flex-col h-full">
      <MessageListServer channelId={params.channelId} variant="channel" />
    </div>
  )
} 