### Custom Hooks Documentation

The `hooks/` directory contains custom React hooks that encapsulate reusable stateful logic across the ChatGenius application.

#### Directory Structure

```
hooks/
├── usePusherHeartbeat.ts  # Real-time connection management
├── useWorkspaces.ts       # Workspace data and operations
└── useAuthSync.ts         # Authentication state synchronization
```

#### Key Hooks

1. **Pusher Heartbeat (`usePusherHeartbeat.ts`)**
   - Maintains WebSocket connection
   - Handles reconnection logic
   - Monitors connection health
   - Manages subscription lifecycle

   ```typescript
   const { isConnected, lastPing } = usePusherHeartbeat({
     channelName: `workspace-${workspaceId}`,
     onConnectionLost: handleConnectionLost
   })
   ```

2. **Workspace Management (`useWorkspaces.ts`)**
   - Fetches workspace data
   - Manages workspace state
   - Handles workspace operations
   - Caches workspace information

   ```typescript
   const { workspaces, loading, error } = useWorkspaces()
   ```

3. **Authentication Sync (`useAuthSync.ts`)**
   - Synchronizes auth state
   - Handles session management
   - Manages user context
   - Handles auth transitions

   ```typescript
   const { user, isLoading } = useAuthSync()
   ```

#### Best Practices

1. **Hook Design**
   - Follow React hooks rules
   - Keep hooks focused and single-purpose
   - Implement proper cleanup
   - Handle all lifecycle events

2. **State Management**
   - Use appropriate state storage
   - Implement proper caching
   - Handle loading states
   - Manage side effects

3. **Error Handling**
   - Implement error boundaries
   - Provide error states
   - Handle edge cases
   - Graceful degradation

#### Common Patterns

1. **Data Fetching Hook**
   ```typescript
   export function useData<T>(id: string) {
     const [data, setData] = useState<T | null>(null)
     const [loading, setLoading] = useState(true)
     const [error, setError] = useState<Error | null>(null)

     useEffect(() => {
       async function fetchData() {
         try {
           const response = await fetch(`/api/data/${id}`)
           const json = await response.json()
           setData(json)
         } catch (err) {
           setError(err as Error)
         } finally {
           setLoading(false)
         }
       }
       fetchData()
     }, [id])

     return { data, loading, error }
   }
   ```

2. **Real-time Hook**
   ```typescript
   export function useRealTime(channelName: string) {
     const [messages, setMessages] = useState([])

     useEffect(() => {
       const channel = pusherClient.subscribe(channelName)
       
       channel.bind('new-message', (data) => {
         setMessages((prev) => [...prev, data])
       })

       return () => {
         channel.unbind_all()
         channel.unsubscribe()
       }
     }, [channelName])

     return messages
   }
   ```

3. **Context Consumer Hook**
   ```typescript
   export function useWorkspaceContext() {
     const context = useContext(WorkspaceContext)
     
     if (!context) {
       throw new Error(
         'useWorkspaceContext must be used within WorkspaceProvider'
       )
     }
     
     return context
   }
   ```

#### Usage Guidelines

1. **Hook Naming**
   - Prefix with 'use'
   - Clear and descriptive names
   - Indicate primary purpose
   - Follow naming conventions

2. **Dependencies**
   - Minimize external dependencies
   - Properly manage effect dependencies
   - Handle cleanup properly
   - Avoid infinite loops

3. **Type Safety**
   - Use TypeScript
   - Define proper interfaces
   - Handle null/undefined cases
   - Validate inputs

4. **Testing**
   - Write unit tests
   - Test error cases
   - Mock external dependencies
   - Test cleanup logic

See individual hook files for detailed documentation of specific implementations. 