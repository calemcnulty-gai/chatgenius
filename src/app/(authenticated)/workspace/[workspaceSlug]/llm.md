# Workspace Layout Organization

This directory contains the workspace layout implementation, which is responsible for rendering the main workspace UI including channels, DMs, and user lists.

## Code Structure

1. `layout.tsx`: The main layout component that:
   - Handles authentication
   - Loads workspace data using the workspace service
   - Renders the WorkspaceLayoutClient component
   - Uses the root-level UserProvider (no duplicate provider)

2. Supporting Services (`/src/services/workspace/layout.ts`):
   - `getUserAndValidate`: Loads and validates the current user
   - `getAndValidateWorkspace`: Loads and validates workspace access
   - `getWorkspaceChannels`: Loads channels with unread counts
   - `getWorkspaceMembers`: Loads workspace members
   - `getDMChannels`: Loads DM channels with unread counts
   - `getWorkspaceLayoutData`: Orchestrates all data loading

3. Types (`/src/types/workspace/layout.ts`):
   - `WorkspaceLayoutData`: Main data interface for the layout
   - `ValidationError`: Error type for validation failures

## Data Flow

1. The layout component first checks authentication
2. It then uses the workspace service to load all required data
3. The data is passed to the WorkspaceLayoutClient component which handles the UI rendering
4. The WorkspaceLayoutClient accesses user data from the root-level UserProvider
5. Error handling redirects users to appropriate pages based on validation failures

## Provider Strategy

- Uses the single root-level UserProvider from AppProviders
- Avoids duplicate provider instances that could cause unmounting issues
- Maintains stable provider context throughout navigation
- Prevents subscription loss in real-time features

## Error Handling

- Authentication failures redirect to /sign-in
- Missing workspace access redirects to /
- Other errors are thrown to the error boundary 