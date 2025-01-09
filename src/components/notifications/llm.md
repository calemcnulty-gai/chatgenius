# Notifications Components

This directory contains components related to notification functionality in the ChatGenius application.

## Components Overview

### NotificationBell
A client-side component that handles real-time notifications. Features:
- Uses UserContext for user identification
- Real-time updates through Pusher
- Handles channel mentions and direct messages
- Visual indicator for unread notifications

Key features:
- Integrates with UserContext for consistent user data access
- Real-time notification updates
- Notification grouping by type
- Click-through navigation to relevant messages

## Data Flow
1. Component subscribes to Pusher channel using user ID from context
2. Real-time events are processed and stored in local state
3. Notifications are displayed with unread indicators
4. Click handlers navigate to relevant content

## Type Definitions
- Strongly typed notification structure
- Integration with Pusher event types
- Type-safe user data through UserContext 