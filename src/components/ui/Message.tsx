import { cn } from "@/lib/utils";
import { User } from "@/types/user";
import { useUser } from "@/contexts/UserContext";
import { UserAvatar } from "./UserAvatar";
import { UserDisplay } from "./UserDisplay";
import { format } from "date-fns";
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Timestamp, parseTimestamp } from '@/types/timestamp';
import { MessageAttachments } from './MessageAttachments';

export type MessageVariant = 'channel' | 'thread' | 'dm';

interface MessageProps {
  id: string;
  content: string;
  sender: User;
  createdAt: Timestamp;
  variant?: MessageVariant;
  replyCount?: number;
  latestReplyAt?: Timestamp;
  parentMessageId?: string;
  channelId?: string;
  className?: string;
  attachments?: {
    files: string[]
  };
  onThreadClick?: (messageId: string) => void;
}

export function Message({
  id,
  content,
  sender,
  createdAt,
  variant = 'channel',
  replyCount = 0,
  latestReplyAt,
  parentMessageId,
  channelId,
  className,
  attachments,
  onThreadClick
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
    if (onThreadClick) {
      onThreadClick(id);
    } else {
      // Fallback to the old event-based system
      const event = new CustomEvent('open-thread', {
        detail: { messageId: id },
        bubbles: true,
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-x-3 hover:bg-gray-800/30 py-2",
        isCurrentUser && "bg-gray-800/20",
        variant === 'thread' && "pl-6", // Extra padding for thread replies
        className
      )}
    >
      <div className="px-4 flex gap-x-3 flex-1">
        <UserAvatar user={displayUser} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-sm">
            <UserDisplay 
              user={displayUser}
              variant="text-with-status"
              className="font-medium text-gray-200"
            />
            <span className="text-xs text-gray-500">
              {format(parseTimestamp(createdAt), "MMM d, h:mm a")}
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-0.5">{content}</p>
          {/* Display attachments */}
          {attachments?.files && attachments.files.length > 0 && (
            <MessageAttachments messageId={id} className="mt-2" />
          )}
          {/* Show thread UI for channel messages that aren't already in a thread */}
          {variant === 'channel' && !parentMessageId && (
            <div className="mt-1">
              <button
                onClick={handleThreadClick}
                className="group inline-flex items-center gap-x-2 text-xs text-gray-500 hover:text-gray-300"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>
                  {replyCount > 0 ? (
                    <>
                      {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                      {latestReplyAt && ` · ${format(parseTimestamp(latestReplyAt), "MMM d, h:mm a")}`}
                    </>
                  ) : (
                    'Reply in thread'
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 