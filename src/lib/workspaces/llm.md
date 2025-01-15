# Workspaces Service

This directory contains the core business logic for managing workspaces in ChatGenius.

## Directory Structure

```
/workspaces/
├── types.ts           # Type definitions
├── validation.ts      # Input validation and user retrieval
├── queries.ts         # Database operations
└── services/
    ├── list.ts       # List user's workspaces
    └── create.ts     # Create new workspace
```

## Components

### Types (types.ts)
- `Workspace`: Database workspace model
- `WorkspaceMembership`: Database workspace membership model
- `CreateWorkspaceParams`: Parameters for workspace creation
- `GetWorkspacesParams`: Parameters for listing workspaces
- `WorkspaceWithRole`: Workspace with member role

### Validation (validation.ts)
- User validation and retrieval
- Workspace name validation
- Slug generation from workspace name

### Queries (queries.ts)
- Database operations for workspaces
- Database operations for workspace memberships
- Database operations for initial channel creation

### Services

#### List Service (services/list.ts)
- Lists all workspaces for a user
- Handles Gauntlet workspace auto-join
- Returns workspaces with user roles

#### Create Service (services/create.ts)
- Creates new workspace
- Creates owner membership
- Creates default #general channel
- Validates input
- Returns workspace or error

## Usage

```typescript
// List workspaces
const workspaces = await listWorkspaces({ clerkUser })

// Create workspace
const { workspace, error } = await createNewWorkspace({ 
  name: 'My Workspace', 
  clerkUser 
})
```

## Error Handling
- Input validation errors
- Database errors
- Authentication errors
- Returns appropriate error messages

## Future Improvements
- Add workspace update service
- Add workspace delete service
- Add member management services
- Add workspace settings management 