# Chat Components

This directory contains components related to chat functionality in the ChatGenius application, including message display, threading, and real-time updates.

## Components Overview

### MessageList
A core component that displays and manages messages in channels and DMs.

Features:
- Real-time message updates via Pusher
- Infinite scroll with virtualization
- Optimistic updates for sent messages
- Thread integration
- File attachment support
- AI command integration
- Message reactions
- Read receipts

Props:
```typescript
interface MessageListProps {
  channelId: string
  isDm?: boolean
  className?: string
  onThreadOpen?: (messageId: string) => void
}
```

### ThreadPanel
A component for displaying and managing message threads.

Features:
- Parent message context
- Real-time reply updates
- Reply composition
- File attachments in replies
- Participant tracking
- Reply count updates
- Thread activity indicators

Props:
```typescript
interface ThreadPanelProps {
  messageId: string
  channelId: string
  onClose: () => void
  className?: string
}
```

## Component Architecture

### Message Flow
1. **Message Composition**
   ```typescript
   async function handleSend(content: string, attachments?: File[]) {
     // Optimistic update
     const tempId = generateTempId()
     addTempMessage({ id: tempId, content, attachments })
     
     // Send to server
     const result = await sendMessage({ content, attachments })
     
     // Update with real message
     replaceTempMessage(tempId, result)
   }
   ```

2. **Real-time Updates**
   ```typescript
   useEffect(() => {
     const channel = pusherClient.subscribe(`channel-${channelId}`)
     channel.bind('new-message', handleNewMessage)
     channel.bind('update-message', handleUpdateMessage)
     channel.bind('delete-message', handleDeleteMessage)
     // ... more event handlers
   }, [channelId])
   ```

### Threading System

1. **Thread Management**
   - Parent-child message relationships
   - Reply count tracking
   - Latest reply timestamps
   - Participant tracking
   - Activity indicators

2. **Thread Navigation**
   ```typescript
   function handleThreadClick(messageId: string) {
     setActiveThread(messageId)
     updateThreadPanel(true)
     fetchThreadMessages(messageId)
   }
   ```

### AI Integration

1. **Command Processing**
   ```typescript
   async function handleAiCommand(query: string) {
     // Send to RAG endpoint
     const response = await fetch('/api/rag', {
       method: 'POST',
       body: JSON.stringify({ query })
     })
     
     // Format and display response
     const { answer, sources } = await response.json()
     sendFormattedAiResponse(answer, sources)
   }
   ```

2. **Source Display**
   - Relevant document snippets
   - Source attribution
   - Confidence scores
   - Follow-up suggestions

## Features

1. **Message Handling**
   - Text formatting
   - Code blocks
   - Link previews
   - Image attachments
   - File uploads
   - Reactions
   - Editing
   - Deletion

2. **Thread Features**
   - Reply composition
   - Participant list
   - Activity tracking
   - Notification settings
   - Thread summary
   - Jump to thread

3. **AI Capabilities**
   - Document retrieval
   - Context-aware responses
   - Source citations
   - Follow-up handling
   - Command suggestions

## Best Practices

1. **Performance**
   - Message virtualization
   - Optimistic updates
   - Efficient re-renders
   - Image optimization
   - Lazy loading

2. **User Experience**
   - Smooth scrolling
   - Loading states
   - Error handling
   - Keyboard shortcuts
   - Mobile support

3. **Data Management**
   - Local caching
   - State persistence
   - Proper cleanup
   - Type safety

4. **Error Handling**
   - Network failures
   - Upload errors
   - API errors
   - Retry logic

## State Management

1. **Global State**
   - User context
   - Channel data
   - Online presence
   - Preferences

2. **Local State**
   - Message cache
   - Thread state
   - UI state
   - Form data

3. **Real-time State**
   - Message updates
   - Thread activity
   - User presence
   - Typing indicators

See individual component files for detailed implementation examples. 