# Server Components Directory

This directory contains Next.js server components that are responsible for data fetching and server-side operations. These components are designed to work with the React Server Components pattern in Next.js 13+.

## Directory Structure

```
server-components/
  chat/              # Chat-related server components
  workspace/         # Workspace-related server components
  user/             # User-related server components
```

## Purpose

- Server components in this directory handle data fetching and processing on the server
- They pass processed data as props to client components
- They should not contain any client-side interactivity or state
- They can directly access server-only resources like databases
- They should not use hooks or browser APIs

## Usage

Server components should:
1. Fetch and process data on the server
2. Pass data as props to client components
3. Handle initial state and loading
4. Not include any client-side interactivity

Example:
```tsx
// server-components/chat/MessageListServer.tsx
async function MessageListServer({ channelId }: { channelId: string }) {
  const messages = await fetchMessages(channelId)
  return <MessageList initialMessages={messages} channelId={channelId} />
}
``` 