# UI Components

This directory contains reusable UI components used throughout the ChatGenius application.

## Components Overview

### Message
A general-purpose message component that displays chat messages in various contexts (channels, threads, DMs).

Props:
- `id`: Message identifier
- `content`: Message content
- `sender`: User who sent the message
- `createdAt`: Message timestamp
- `variant`: Message display variant ('channel' | 'thread' | 'dm')
- `replyCount`: Number of replies (optional)
- `latestReplyAt`: Latest reply timestamp (optional)
- `parentMessageId`: ID of parent message if this is a reply (optional)
- `channelId`: Channel identifier (optional)
- `className`: Additional CSS classes (optional)
- `attachments`: Object containing array of file names for attached images (optional)
- `onThreadClick`: Callback when thread button is clicked (optional)

Features:
- Consistent message display across all contexts
- User avatar and display name
- Timestamp formatting
- Thread support for channel messages
- Image attachment display
- Current user message highlighting
- Real-time user data updates

### Skeleton
A component that provides loading state placeholders that match the shape of the content being loaded.

Props:
- `className`: Additional CSS classes for customizing dimensions and appearance

Features:
- Animated pulse effect
- Dark mode support
- Customizable dimensions
- Maintains layout stability
- Reduces perceived loading time

Usage:
```tsx
// Basic usage with custom dimensions
<Skeleton className="h-4 w-24" />

// Avatar placeholder
<Skeleton className="h-10 w-10 rounded-full" />

// Text block placeholder
<Skeleton className="h-4 w-full" />

// Complex content placeholder
<div className="space-y-2">
  <Skeleton className="h-6 w-1/3" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-2/3" />
</div>
```

Key features:
- Maintains visual hierarchy during loading
- Prevents layout shifts
- Provides immediate visual feedback
- Scales to any content shape
- Consistent with design system
- Improves perceived performance

### User Components
- `UserAvatar`: Displays user profile images with status indicators
- `UserDisplay`: Shows user names and additional information

### Input Components
- `MessageInput`: Universal message input component used across channels, DMs, and threads
  - Handles message submission
  - Supports parent messages for threads
  - Context-agnostic (works in any messaging context)
  - Supports AI commands with RAG integration
  - Props:
    - `channelId`: Target channel identifier
    - `parentMessageId`: Optional parent message for threads
    - `onMessageSent`: Callback after successful message send
    - `placeholder`: Custom input placeholder
    - `className`: Additional styling classes
  - Commands:
    - `/ai [query]`: Retrieves relevant documents and generates AI responses using RAG

### Layout Components
- `Skeleton`: Loading state placeholders
- Modal base components
- Common layout structures

### Interactive Elements
- Buttons
- Form controls
- Interactive overlays

#### Usage Guidelines

1. **Component Structure**
   ```typescript
   export function ComponentName({ 
     required,
     optional = defaultValue 
   }: Props) {
     // Component logic
   }
   ```

2. **Best Practices**
   - Keep components focused and single-responsibility
   - Use TypeScript for type safety
   - Implement proper prop validation
   - Use composition over inheritance
   - Handle loading and error states

3. **Styling**
   - Use Tailwind CSS classes
   - Support className prop for customization
   - Follow dark theme patterns
   - Maintain consistent spacing

4. **State Management**
   - Use hooks for local state
   - Accept callbacks for parent communication
   - Handle loading states
   - Proper error handling

See individual components for detailed implementation examples. 

# UI Components Documentation

This directory contains reusable UI components used throughout the ChatGenius application.

## Message Component

The Message component displays individual chat messages with the following features:
- User avatar and display name
- Message content
- Timestamp display using the standardized `Timestamp` type
- Thread reply functionality
- Attachment display

### Timestamp Handling
The Message component uses the application's standardized timestamp system:
- `createdAt` and `latestReplyAt` are strictly typed as `Timestamp`
- Timestamps are parsed using the `parseTimestamp` utility
- Formatting is consistent across the application using date-fns
