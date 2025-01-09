# Contexts

## UserContext

The `UserContext` provides centralized user data management across the application. It serves as the single source of truth for user information, ensuring consistent display of user data (like display names) across all components.

### Usage

```typescript
// Reading user data and state
const { user, isLoading, error } = useUser()

// Updating user data
const { updateUser } = useUser()
await updateUser({ displayName: 'New Name' }) // Partial updates supported

// Error handling
const { clearError } = useUser()
clearError() // Clear any existing errors
```

### Components
- Provider: `UserProvider` - Must wrap components that need access to user data
- Hook: `useUser` - Hook to access user data, loading states, and error handling

### Data Flow
1. Initial user data is passed to `UserProvider`
2. Components read user data through `useUser` hook
3. Updates are made through async `updateUser` function
4. Loading states and errors are managed automatically
5. Periodic refresh keeps data in sync
6. All subscribed components automatically re-render with new data

### Key Features
- Single source of truth for user data
- Loading and error state management
- Type-safe partial updates
- Automatic data validation
- Periodic background refresh
- Centralized error handling
- API synchronization

### Error Handling
- Validation errors for invalid data
- API error handling and display
- Error clearing functionality
- Loading state management during updates

### Type Safety
- Full TypeScript support
- Type-safe partial updates
- Proper error type definitions
- Loading state type safety 