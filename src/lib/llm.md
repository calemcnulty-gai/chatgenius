### Library Documentation

The `lib/` directory contains utility functions, external service integrations, and shared functionality used throughout the ChatGenius application.

#### Directory Structure

```
lib/
├── db/        # Database utility functions
├── pusher.ts  # Real-time messaging integration
└── utils.ts   # General utility functions
```

#### Key Components

1. **Real-time Messaging (`pusher.ts`)**
   - Pusher integration for real-time updates
   - Server and client configuration
   - Channel management
   - Event handling

   ```typescript
   // Example: Server-side event trigger
   await pusherServer.trigger(
     `workspace-${workspaceId}`,
     'new-message',
     messageData
   )

   // Example: Client-side subscription
   const channel = pusherClient.subscribe(
     `workspace-${workspaceId}`
   )
   ```

2. **Utility Functions (`utils.ts`)**
   - Common helper functions
   - Type guards
   - Format conversions
   - Shared constants

3. **Database Utilities (`db/`)**
   - Query helpers
   - Connection management
   - Type definitions
   - Migration utilities

#### Best Practices

1. **Real-time Communication**
   - Use singleton pattern for Pusher client
   - Implement proper connection management
   - Handle reconnection gracefully
   - Clean up subscriptions

2. **Error Handling**
   - Implement proper error boundaries
   - Type-safe error handling
   - Graceful degradation
   - Meaningful error messages

3. **Performance**
   - Optimize real-time connections
   - Implement proper caching
   - Minimize unnecessary updates
   - Handle rate limiting

#### Common Patterns

1. **Pusher Integration**
   ```typescript
   // Server-side
   export const pusherServer = new PusherServer({
     appId: process.env.PUSHER_APP_ID!,
     key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
     secret: process.env.PUSHER_SECRET!,
     cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
     useTLS: true,
   })

   // Client-side
   export function initPusherClient() {
     if (!pusherClientInstance) {
       pusherClientInstance = new PusherClient(
         process.env.NEXT_PUBLIC_PUSHER_KEY!,
         {
           cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
         }
       )
     }
     return pusherClientInstance
   }
   ```

2. **Utility Functions**
   ```typescript
   // Example utility function
   export function formatChannelName(
     workspace: string,
     channel: string
   ): string {
     return `${workspace}-${channel}`
   }
   ```

3. **Type Guards**
   ```typescript
   export function isWorkspaceAdmin(
     user: User,
     workspaceId: string
   ): boolean {
     return user.workspaces?.[workspaceId]?.role === 'admin'
   }
   ```

#### Usage Guidelines

1. Keep utility functions pure and testable
2. Document complex functions and types
3. Use meaningful variable and function names
4. Implement proper error handling
5. Follow TypeScript best practices

See individual files for detailed documentation of specific utilities and integrations. 