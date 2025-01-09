# Workspace Components

This directory contains components related to workspace functionality in the ChatGenius application.

## Components Overview

### WorkspaceLayoutClient
A client-side component that wraps the workspace layout and integrates with UserContext. It handles:
- User data display and management through UserContext
- Workspace sidebar rendering
- Channel and DM channel display
- User avatar and notification display

Key features:
- Uses UserContext for consistent user data access
- Formats DM channels for proper display
- Handles user status display

### WorkspaceSidebar
Displays the main navigation sidebar for a workspace, including:
- Channel list
- Direct message list
- User list
- Workspace header with user controls

### DirectMessageList
Displays and manages direct message channels:
- Shows list of DM conversations
- Handles user status indicators
- Manages unread message counts

### UserList
Displays the list of users in a workspace:
- Shows user status
- Handles user selection for DMs
- Integrates with workspace membership data

### StartDMModal
Modal for initiating direct messages:
- User selection interface
- Status indicators
- Integration with workspace user list

## Data Flow
1. Server component (WorkspaceLayout) fetches initial data
2. Data is passed through UserProvider for context
3. Client components consume user data through useUser() hook
4. Updates to user data are managed through context

## Type Definitions
- Uses strongly typed props for all components
- Integrates with database schema types
- Handles proper type conversion for dates and statuses 