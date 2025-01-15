# Channels Service

This directory contains the core business logic for managing channels in ChatGenius.

## Directory Structure

```
/channels/
├── types.ts           # Type definitions
├── validation.ts      # Input validation and access checks
├── queries.ts         # Database operations
└── services/
    ├── list.ts       # List workspace channels
    └── create.ts     # Create new channel
```

## Components

### Types (types.ts)
- `Channel`: Database channel model
- `ChannelType`: Channel visibility type ('public' | 'private')
- `CreateChannelParams`: Parameters for channel creation
- `GetChannelsParams`: Parameters for listing channels
- `ChannelValidationError`: Structured error responses

### Validation (validation.ts)
- User validation and retrieval
- Channel name validation
- Workspace membership validation
- Slug generation from channel name

### Queries (queries.ts)
- Database operations for channels
- Workspace-scoped channel queries
- Channel creation operations

### Services

#### List Service (services/list.ts)
- Lists all channels in a workspace
- Validates workspace membership
- Returns channels or error

#### Create Service (services/create.ts)
- Creates new channel
- Validates input and permissions
- Returns channel or error

## Usage

```typescript
// List channels
const { channels, error } = await listChannels({ 
  workspaceId, 
  clerkUser 
})

// Create channel
const { channel, error } = await createNewChannel({ 
  name: 'announcements',
  workspaceId,
  type: 'public',
  clerkUser
})
```

## Error Handling
- Input validation errors
- Authorization errors
- Not found errors
- Returns structured error responses

## Future Improvements
- Add channel update service
- Add channel delete service
- Add channel member management
- Add channel settings management
- Add channel archiving functionality 