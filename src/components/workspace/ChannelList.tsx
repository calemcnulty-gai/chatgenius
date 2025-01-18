'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useUserAuth } from '@/contexts/user/UserAuthContext'
import { HashtagIcon, PlusIcon } from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import CreateChannel from './CreateChannel'
import { PusherEvent, NewChannelMessageEvent, NewMentionEvent } from '@/types/events'
import { useUserChannel } from '@/contexts/pusher/UserChannelContext'

type Channel = {
  id: string
  name: string
  slug: string
  hasUnread?: boolean
  hasMention?: boolean
  mentionCount?: number
}

type ChannelListProps = {
  channels: Channel[]
  workspaceId: string
}

export default function ChannelList({ channels: initialChannels, workspaceId }: ChannelListProps) {
  const params = useParams()
  const { user } = useUserAuth()
  const { channel: userChannel } = useUserChannel()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [channels, setChannels] = useState(initialChannels)

  // Fetch initial mention counts
  useEffect(() => {
    if (!user?.id || !workspaceId) return

    fetch(`/api/mentions/counts?workspaceId=${workspaceId}`)
      .then(res => res.json())
      .then(data => {
        setChannels(currentChannels => 
          currentChannels.map(channel => ({
            ...channel,
            mentionCount: data.counts[channel.id] || 0,
            hasMention: (data.counts[channel.id] || 0) > 0
          }))
        )
      })
      .catch(error => {
        console.error('Error fetching mention counts:', error)
      })
  }, [user?.id, workspaceId])

  // Set up event listeners for channel events
  useEffect(() => {
    if (!user?.id || !userChannel) return

    console.log('[ChannelList] Setting up event listeners')

    const handleNewMessage = (data: NewChannelMessageEvent) => {
      console.log('[ChannelList] Message handler triggered:', {
        data,
        currentChannels: channels,
        userId: user.id,
        channelRef: userChannel.name,
        eventType: PusherEvent.NEW_CHANNEL_MESSAGE,
        timestamp: new Date().toISOString()
      })

      setChannels(currentChannels => {
        console.log('[ChannelList] Updating channels:', {
          before: currentChannels,
          messageChannelId: data.channelId,
          timestamp: new Date().toISOString()
        })
        
        const updated = currentChannels.map(channel =>
          channel.id === data.channelId
            ? { ...channel, hasUnread: true }
            : channel
        )
        
        console.log('[ChannelList] Channels updated:', {
          after: updated,
          timestamp: new Date().toISOString()
        })
        
        return updated
      })
    }

    const handleNewMention = (data: NewMentionEvent) => {
      setChannels(currentChannels =>
        currentChannels.map(channel =>
          channel.id === data.channelId
            ? { ...channel, hasMention: true }
            : channel
        )
      )
    }

    // Bind event handlers
    userChannel.bind(PusherEvent.NEW_CHANNEL_MESSAGE, handleNewMessage)
    userChannel.bind(PusherEvent.NEW_MENTION, handleNewMention)

    // Cleanup function
    return () => {
      console.log('[ChannelList] Cleaning up event listeners')
      userChannel.unbind(PusherEvent.NEW_CHANNEL_MESSAGE, handleNewMessage)
      userChannel.unbind(PusherEvent.NEW_MENTION, handleNewMention)
    }
  }, [user?.id, userChannel])

  // Clear mention count when entering a channel
  useEffect(() => {
    if (!params.channelSlug) return

    const currentChannel = channels.find(c => c.slug === params.channelSlug)
    if (currentChannel?.hasMention) {
      fetch(`/api/mentions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelId: currentChannel.id
        })
      }).then(() => {
        setChannels(currentChannels =>
          currentChannels.map(channel => {
            if (channel.id === currentChannel.id) {
              return {
                ...channel,
                mentionCount: 0,
                hasMention: false
              }
            }
            return channel
          })
        )
      })
    }
  }, [params.channelSlug])

  // Update channels when initial data changes
  useEffect(() => {
    setChannels(initialChannels)
  }, [initialChannels])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-2">
        <h2 className="text-sm font-semibold uppercase text-gray-400">Channels</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-gray-400 hover:text-gray-300"
          title="Create channel"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1 px-1">
        {channels.map((channel) => {
          const isActive = channel.slug === params.channelSlug;
          const hasUnread = !isActive && channel.hasUnread;

          return (
            <Link
              key={channel.id}
              href={`/workspace/${params.workspaceSlug}/channel/${channel.slug}`}
              className={`
                flex items-center justify-between rounded-md px-2 py-1.5
                ${isActive
                  ? 'bg-gray-800 text-gray-200'
                  : hasUnread
                  ? 'text-white hover:bg-gray-800'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-x-2">
                <HashtagIcon className="h-4 w-4" />
                <span className={`${hasUnread ? 'font-semibold' : ''}`}>
                  {channel.name}
                </span>
              </div>
              {channel.hasMention && channel.mentionCount ? (
                <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {channel.mentionCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCreateModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-start justify-between">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">
                      Create Channel
                    </Dialog.Title>
                    <button
                      onClick={() => setIsCreateModalOpen(false)}
                      className="rounded-md text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4">
                    <CreateChannel
                      workspaceId={workspaceId}
                      onComplete={() => setIsCreateModalOpen(false)}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
} 