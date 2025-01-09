# Profile Components

This directory contains components related to user profile management in the ChatGenius application.

## Components Overview

### ProfileEditModal
A client-side component that handles user profile editing. Features:
- Uses enhanced UserContext for data management and state handling
- Handles profile image uploads with error handling
- Manages timezone selection
- Handles loading and error states

Key features:
- Integrates with UserContext for:
  - User data access and updates
  - Loading state management
  - Error handling and display
  - Automatic API synchronization
- Real-time form validation
- Image upload handling with separate error state
- Timezone management
- Disabled state handling during updates
- Error message display (context and upload errors)

### ProfileModal
A component for displaying user profiles. Features:
- Uses UserContext for current user comparison
- Displays user details and status
- Shows timezone information
- Handles profile image display

### ProfileView
A component for rendering user profile information. Features:
- Displays user details in a structured format
- Shows profile image
- Handles timezone display
- Shows user status

## Data Flow
1. Components access user data and state through UserContext
2. Form data is managed in local state
3. Updates are handled through UserContext's updateUser
4. Loading states are managed by UserContext
5. Errors are handled and displayed automatically
6. Image uploads maintain separate error state
7. Form inputs respect loading states

## Type Definitions
- Strongly typed user data through UserContext
- Type-safe partial updates
- Form validation types
- Image upload handling types
- Timezone selection types
- Error state types

## Error Handling
- Context-level errors through UserContext
- Component-level errors for image uploads
- Automatic error clearing on modal open
- Loading state indication
- Disabled controls during updates

## State Management
- User data through UserContext
- Loading states from context
- Error states (context and local)
- Form field states
- Image upload state
- Modal open/close state 