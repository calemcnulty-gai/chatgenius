# Chat Components

This directory contains components related to chat functionality in the ChatGenius application.

## Components Overview

### Message
A component that displays individual chat messages with user information, thread functionality, and image attachments.

Props:
- `id`: Message identifier
- `content`: Message content
- `sender`: User who sent the message
- `createdAt`: Message timestamp
- `replyCount`: Number of replies (optional)
- `latestReplyAt`: Latest reply timestamp (optional)
- `parentMessageId`: ID of parent message if this is a reply (optional)
- `channelId`: Channel identifier
- `className`: Additional CSS classes (optional)
- `attachments`: Object containing array of file names for attached images (optional)

### MessageList
A component that displays a list of messages and handles real-time updates.

Features:
- Real-time message updates via Pusher
- Infinite scroll for message history
- Temporary message display while sending
- Integration with shared MessageInput component
- Handles both channel messages and DMs
- Thread support

Props:
- `channelId`: Channel or DM channel identifier

### ThreadPanel
A component that displays a message thread with its replies.

Features:
- Shows parent message
- Lists all replies
- Real-time updates for new replies
- Integration with shared MessageInput component
- Reply count tracking

Props:
- `messageId`: Parent message identifier
- `channelId`: Channel identifier
- `onClose`: Callback when thread panel is closed

## Architecture

### Message Flow
1. Messages are composed using the shared MessageInput component
2. Messages are sent to the API
3. Real-time updates are received via Pusher
4. Messages are rendered with proper threading support

### Component Relationships
- MessageList uses shared MessageInput for composition
- ThreadPanel uses shared MessageInput for replies
- Message components handle individual message display
- All components use shared UI elements from @/components/ui

### State Management
- Real-time updates through PusherContext
- User data through UserContext
- Local state for temporary messages and loading
- Thread state managed by parent components

See individual component files for detailed implementation. 