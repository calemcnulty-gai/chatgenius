# Notifications Service

This directory contains the core business logic for managing notifications in ChatGenius.

## Directory Structure

```
/notifications/
├── types.ts           # Type definitions
├── validation.ts      # Input validation and access checks
├── queries.ts         # Database operations
└── services/
    ├── list.ts       # List user notifications
    └── mark-read.ts  # Mark notifications as read
```

## Components

### Types (types.ts)
- `Notification`: Database notification model
- `GetNotificationsParams`: Parameters for listing notifications
- `MarkAsReadParams`: Parameters for marking notifications as read
- `NotificationError`: Structured error responses
- `NotificationsResponse`: List response with error handling
- `MarkAsReadResponse`: Update response with error handling

### Validation (validation.ts)
- User validation and retrieval
- Notification access validation
- Pagination limit validation
- Error handling

### Queries (queries.ts)
- Notification retrieval operations
- Mark as read operations
- Single notification lookup
- Pagination support

### Services

#### List Service (services/list.ts)
- Lists user notifications
- Handles pagination
- Validates input
- Returns notifications or error

#### Mark Read Service (services/mark-read.ts)
- Marks notifications as read
- Supports single or all notifications
- Validates access
- Returns success or error

## Usage

```typescript
// List notifications
const { notifications, error } = await listNotifications({ 
  clerkUser,
  limit: 20
})

// Mark as read
const { success, error } = await markRead({
  clerkUser,
  notificationId // Optional, omit to mark all as read
})
```

## Error Handling
- Input validation errors
- Access control errors
- Not found errors
- Returns structured error responses

## Future Improvements
- Add notification creation service
- Add notification deletion
- Add notification preferences
- Add notification categories
- Add read/unread counts
- Add notification search 