# Notifications Components

This directory contains components related to notification functionality in the ChatGenius application.

## Components Overview

### NotificationBell
A client-side component that handles real-time notifications and user alerts. 

Features:
- Real-time notification updates via Pusher
- Unread count indicator
- Notification grouping and categorization
- Click-through navigation
- Sound alerts (configurable)
- Desktop notifications (with permission)

Key integrations:
- UserContext for user data and preferences
- Pusher for real-time events
- React Query for data fetching
- Browser Notifications API

## Component Architecture

1. **State Management**
   ```typescript
   interface NotificationState {
     items: Notification[]
     unreadCount: number
     isOpen: boolean
     sound: boolean
     desktop: boolean
   }
   ```

2. **Real-time Integration**
   ```typescript
   useEffect(() => {
     const channel = pusherClient.subscribe(`user-${userId}`)
     channel.bind('notification', handleNotification)
     return () => {
       channel.unbind('notification', handleNotification)
       pusherClient.unsubscribe(`user-${userId}`)
     }
   }, [userId])
   ```

## Notification Types

1. **Message Mentions**
   - Channel mentions (@user)
   - Group mentions (@here, @channel)
   - Thread mentions
   - Reply notifications

2. **Direct Messages**
   - New DM notifications
   - DM read receipts
   - Group DM updates

3. **Workspace Events**
   - Channel invites
   - Workspace invites
   - Role changes
   - Member updates

## Features

1. **Notification Display**
   - Badge counter
   - Notification list
   - Grouped by type
   - Time-based sorting
   - Read/unread status

2. **User Preferences**
   - Sound settings
   - Desktop notifications
   - Do not disturb
   - Custom notification rules

3. **Interaction Handling**
   - Click navigation
   - Mark as read
   - Clear notifications
   - Notification settings

## Best Practices

1. **Performance**
   - Efficient state updates
   - Debounced notifications
   - Optimistic UI updates
   - Proper cleanup

2. **User Experience**
   - Clear visual feedback
   - Consistent behavior
   - Accessibility support
   - Mobile responsiveness

3. **Error Handling**
   - Connection failures
   - Permission denials
   - API errors
   - State recovery

4. **Security**
   - Permission checks
   - Data validation
   - XSS prevention
   - Rate limiting

## Implementation Examples

1. **Notification Processing**
   ```typescript
   function processNotification(data: NotificationData) {
     switch (data.type) {
       case 'mention':
         return handleMention(data)
       case 'dm':
         return handleDirectMessage(data)
       case 'workspace':
         return handleWorkspaceEvent(data)
     }
   }
   ```

2. **Permission Handling**
   ```typescript
   async function requestNotificationPermission() {
     try {
       const permission = await Notification.requestPermission()
       setDesktopEnabled(permission === 'granted')
     } catch (error) {
       console.error('Permission request failed:', error)
     }
   }
   ```

See NotificationBell.tsx for detailed implementation. 