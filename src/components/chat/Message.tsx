'use client'

import { cn } from "@/lib/utils";
import { User } from "@/types/user";
import { useUser } from "@/contexts/UserContext";
import { UserAvatar } from "../ui/UserAvatar";
import { UserDisplay } from "../ui/UserDisplay";
import { format } from "date-fns";
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface MessageProps {
  id: string;
  content: string;
  sender: User;
  createdAt: string;
  replyCount?: number;
  latestReplyAt?: string;
  parentMessageId?: string;
  channelId: string;
  className?: string;
  attachments?: {
    files: string[]
  };
}

export function Message({
  id,
  content,
  sender,
  createdAt,
  replyCount = 0,
  latestReplyAt,
  parentMessageId,
  channelId,
  className,
  attachments
}: MessageProps) {
  const { user } = useUser();
  const isCurrentUser = user?.id === sender.id;

  // If this is the current user's message, use the latest user data from context
  const displayUser = isCurrentUser && user ? {
    ...sender,
    profileImage: user.profileImage || sender.profileImage,
    displayName: user.displayName || sender.displayName,
    name: user.name || sender.name,
    title: user.title || sender.title,
    status: user.status || sender.status,
  } : sender;

  const handleThreadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const event = new CustomEvent('open-thread', {
      detail: { messageId: id },
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-x-3 hover:bg-gray-800/50 px-4 py-2",
        isCurrentUser && "bg-gray-800/30",
        className
      )}
    >
      <UserAvatar user={displayUser} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-sm">
          <UserDisplay 
            user={displayUser}
            variant="text-with-status"
            className="font-medium text-gray-200"
          />
          <span className="text-xs text-gray-500">
            {format(new Date(createdAt), "MMM d, h:mm a")}
          </span>
        </div>
        <p className="text-sm text-gray-300 mt-0.5">{content}</p>
        {attachments?.files && attachments.files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.files.map((filename) => (
              <img
                key={filename}
                src={`/uploads/${filename}`}
                alt="Attached image"
                className="max-w-sm rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              />
            ))}
          </div>
        )}
        {!parentMessageId && replyCount > 0 && (
          <div className="mt-1">
            <button
              onClick={handleThreadClick}
              className="group inline-flex items-center gap-x-2 text-xs text-gray-500 hover:text-gray-300"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <span>
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                {latestReplyAt && ` · ${format(new Date(latestReplyAt), "MMM d, h:mm a")}`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 