### Custom Hooks Documentation

The `hooks/` directory contains custom React hooks that encapsulate reusable stateful logic across the ChatGenius application.

#### Directory Structure

```
hooks/
├── usePusherHeartbeat.ts  # Real-time connection health management
├── useWorkspaces.ts       # Workspace data fetching and state
└── useAuthSync.ts         # User authentication synchronization
```

#### Key Hooks

1. **Pusher Heartbeat (`usePusherHeartbeat.ts`)**
   - Maintains WebSocket connection health through periodic heartbeats
   - Automatically starts/stops heartbeat on connection/disconnection
   - Sends heartbeats every 30 seconds
   - Handles cleanup on unmount

   ```typescript
   // No parameters needed
   usePusherHeartbeat()
   ```

2. **Workspace Management (`useWorkspaces.ts`)**
   - Fetches user's workspaces from API
   - Manages loading and error states
   - Depends on Clerk authentication state
   - Returns typed workspace data

   ```typescript
   const { workspaces, isLoading, error } = useWorkspaces()

   type Workspace = {
     id: string
     name: string
     description: string | null
     slug: string
     role: string
   }
   ```

3. **Authentication Sync (`useAuthSync.ts`)**
   - Synchronizes Clerk auth state with backend
   - Triggers sync on sign-in
   - Handles sync errors gracefully
   - Logs sync status for debugging

   ```typescript
   // No return value, handles sync automatically
   useAuthSync()
   ```

#### Implementation Guidelines

1. **Hook Design**
   - Follow React hooks rules (use 'use' prefix)
   - Keep hooks focused on a single responsibility
   - Implement proper cleanup in useEffect
   - Handle all relevant state transitions

2. **State Management**
   - Use appropriate React state hooks (useState, useRef)
   - Handle loading and error states explicitly
   - Clean up subscriptions and intervals
   - Cache data when appropriate

3. **Error Handling**
   - Log errors for debugging
   - Provide user-friendly error messages
   - Handle network failures gracefully
   - Maintain app stability on errors

4. **Type Safety**
   - Define clear TypeScript interfaces
   - Use strict type checking
   - Document type constraints
   - Handle null/undefined cases

#### Common Patterns

1. **API Integration**
   ```typescript
   export function useApiData() {
     const [data, setData] = useState(null)
     const [isLoading, setIsLoading] = useState(true)
     const [error, setError] = useState(null)

     useEffect(() => {
       fetch('/api/endpoint')
         .then(res => res.json())
         .then(data => {
           setData(data)
           setIsLoading(false)
         })
         .catch(err => {
           setError(err.message)
           setIsLoading(false)
         })
     }, [])

     return { data, isLoading, error }
   }
   ```

2. **Cleanup Pattern**
   ```typescript
   export function useCleanup() {
     useEffect(() => {
       // Setup
       const subscription = setupSubscription()

       // Cleanup
       return () => {
         subscription.unsubscribe()
       }
     }, [])
   }
   ```

3. **Authentication Pattern**
   ```typescript
   export function useAuthRequired() {
     const { isLoaded, isSignedIn } = useUser()
     const router = useRouter()

     useEffect(() => {
       if (isLoaded && !isSignedIn) {
         router.push('/login')
       }
     }, [isLoaded, isSignedIn])
   }
   ```

#### Testing Guidelines

1. **Unit Testing**
   - Test hook behavior in isolation
   - Mock external dependencies
   - Test error conditions
   - Verify cleanup functions

2. **Integration Testing**
   - Test hooks with real components
   - Verify state updates
   - Test loading states
   - Check error handling

3. **Performance Testing**
   - Check for memory leaks
   - Verify cleanup effectiveness
   - Test with large datasets
   - Monitor re-render frequency 