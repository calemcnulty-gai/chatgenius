# Providers

This directory contains React provider components that manage global state and shared functionality across the ChatGenius application.

## Components

### AppProviders

The main provider component that consolidates all context providers in a single place. It ensures providers are mounted in the correct order and only once in the application tree.

Provider hierarchy:
1. `ClerkProvider` - Authentication
2. `UserProvider` - User state management
3. `PusherProvider` - Real-time communication
4. `PusherHeartbeatProvider` - Connection health monitoring

### PusherHeartbeatProvider

A utility provider that maintains the WebSocket connection health by sending periodic heartbeats when a user is authenticated.

## Implementation Details

### Provider Ordering

The providers are ordered to ensure dependencies are available:
1. `ClerkProvider` must be first as it provides authentication
2. `UserProvider` depends on Clerk for user data
3. `PusherProvider` depends on user data for channel subscriptions
4. `PusherHeartbeatProvider` depends on both user data and Pusher connection

### Mounting Strategy

- Providers are mounted at the root layout level
- Each provider is instantiated exactly once
- Providers use internal state management to handle updates
- Clean unmounting is handled to prevent memory leaks

### Error Handling

- Each provider implements its own error boundaries
- Authentication errors are handled gracefully
- Connection issues are managed with retry logic
- State conflicts are resolved systematically

## Best Practices

1. **State Management**
   - Use appropriate caching strategies
   - Implement proper cleanup on unmount
   - Handle race conditions
   - Manage subscription lifecycles

2. **Performance**
   - Minimize re-renders
   - Use memoization where appropriate
   - Implement efficient state updates
   - Handle side effects properly

3. **Security**
   - Validate authentication state
   - Protect sensitive data
   - Implement proper access controls
   - Handle token management securely 