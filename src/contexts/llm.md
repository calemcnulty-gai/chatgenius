# Context Providers

This directory contains React Context providers that manage global state and shared functionality across the ChatGenius application.

## Context Overview

### UserContext
The primary context for user data and authentication state management.

Features:
- User profile data management
- Workspace membership tracking
- Real-time status updates
- Preference management
- Session handling

```typescript
interface UserContextType {
  user: User | null
  isLoading: boolean
  error: Error | null
  updateUser: (data: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  setStatus: (status: UserStatus) => Promise<void>
  preferences: UserPreferences
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>
}
```

### PusherContext
Manages real-time communication and event handling.

Features:
- WebSocket connection management
- Channel subscriptions
- Event binding and handling
- Presence tracking
- Connection health monitoring

```typescript
interface PusherContextType {
  pusherClient: Pusher | null
  subscribe: (channelName: string) => Channel
  unsubscribe: (channelName: string) => void
  presence: {
    members: Map<string, UserPresence>
    subscribe: (channelName: string) => PresenceChannel
  }
}
```

## Implementation Patterns

1. **Context Creation**
   ```typescript
   const UserContext = createContext<UserContextType | null>(null)

   export function UserProvider({ children }: { children: React.ReactNode }) {
     // Provider implementation
   }

   export function useUser() {
     const context = useContext(UserContext)
     if (!context) throw new Error('useUser must be used within UserProvider')
     return context
   }
   ```

2. **State Management**
   ```typescript
   function UserProvider({ children }) {
     const [user, setUser] = useState<User | null>(null)
     const [isLoading, setIsLoading] = useState(true)
     const [error, setError] = useState<Error | null>(null)

     // State management implementation
   }
   ```

3. **Real-time Integration**
   ```typescript
   function PusherProvider({ children }) {
     useEffect(() => {
       const client = new Pusher(PUSHER_KEY, {
         cluster: PUSHER_CLUSTER,
         authEndpoint: '/api/pusher/auth'
       })

       // Connection management
     }, [])
   }
   ```

## Features

1. **User Management**
   - Profile data
   - Authentication state
   - Workspace access
   - Permissions
   - Preferences

2. **Real-time Features**
   - Message events
   - Presence updates
   - Typing indicators
   - Status changes
   - Notifications

3. **State Synchronization**
   - Server sync
   - Local caching
   - Optimistic updates
   - Error recovery
   - Conflict resolution

## Best Practices

1. **Performance**
   - Selective re-renders
   - Memoization
   - Batched updates
   - Event debouncing
   - Efficient caching

2. **Error Handling**
   - Connection failures
   - State conflicts
   - API errors
   - Recovery strategies
   - User feedback

3. **Security**
   - Authentication checks
   - Permission validation
   - Data sanitization
   - Token management
   - Secure channels

4. **Type Safety**
   - Strong typing
   - Null checks
   - Type guards
   - Exhaustive checks
   - Type inference

## Usage Examples

1. **User Context**
   ```typescript
   function ProfileComponent() {
     const { user, updateUser } = useUser()
     
     async function updateProfile(data: Partial<User>) {
       try {
         await updateUser(data)
       } catch (error) {
         handleError(error)
       }
     }
   }
   ```

2. **Pusher Context**
   ```typescript
   function ChatComponent() {
     const { subscribe } = usePusher()
     
     useEffect(() => {
       const channel = subscribe(`chat-${channelId}`)
       channel.bind('new-message', handleNewMessage)
       return () => channel.unbind('new-message', handleNewMessage)
     }, [channelId])
   }
   ```

See individual context files for detailed implementation examples. 