import { getChannel } from '@/lib/dm/queries'
import { DMChannelHeader } from '@/components/dm/DMChannelHeader'
import { notFound } from 'next/navigation'

interface DMChannelLayoutProps {
  children: React.ReactNode
  params: {
    workspaceSlug: string
    channelId: string
  }
}

export default async function DMChannelLayout({ children, params }: DMChannelLayoutProps) {
  const channel = await getChannel(params.channelId)

  if (!channel) {
    notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <DMChannelHeader channel={channel} />
      {children}
    </div>
  )
} 