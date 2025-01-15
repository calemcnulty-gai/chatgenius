# Auth Service

This directory contains the core business logic for authentication and user management in ChatGenius.

## Directory Structure

```
/auth/
├── types.ts           # Type definitions
├── validation.ts      # Input validation
├── queries.ts         # Database operations
├── services/
│   ├── sync.ts       # User sync service
│   └── profile.ts    # Profile management
└── webhooks/
    └── clerk.ts      # Clerk webhook handler
```

## Components

### Types (types.ts)
- `DBUser`: Database user model
- `SyncUserParams`: Parameters for user sync
- `UpdateProfileParams`: Parameters for profile updates
- `ClerkWebhookUser`: Clerk webhook user data
- `AuthError`: Structured error responses

### Validation (validation.ts)
- Profile update validation
- Timezone validation
- Error handling

### Queries (queries.ts)
- User CRUD operations
- Profile updates
- Gauntlet workspace management

### Services

#### Sync Service (services/sync.ts)
- Syncs Clerk users with database
- Creates/updates user records
- Handles Gauntlet workspace membership
- Returns user data or error

#### Profile Service (services/profile.ts)
- Updates user profiles
- Validates input
- Handles user existence checks
- Returns updated user or error

### Webhooks

#### Clerk Handler (webhooks/clerk.ts)
- Verifies webhook signatures
- Handles user events
- Updates user data
- Error handling

## Usage

```typescript
// Sync user
const { user, error } = await syncUser({ clerkUser })

// Update profile
const { user, error } = await updateProfile({
  clerkId,
  displayName,
  title,
  timeZone
})

// Handle webhook
const event = await verifyWebhook(body, headers)
await handleUserEvent(event.type, event.data)
```

## Error Handling
- Input validation errors
- Authentication errors
- Not found errors
- Webhook verification errors
- Returns structured error responses

## Future Improvements
- Add user deletion handling
- Add user suspension/activation
- Add role management
- Add session tracking
- Add audit logging 