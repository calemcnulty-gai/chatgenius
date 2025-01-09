### Type Definitions Documentation

The `types/` directory contains TypeScript type definitions that are used throughout the ChatGenius application. These types ensure type safety and provide clear interfaces for data structures and events.

#### Directory Structure

```
types/
├── db.ts     # Database model type definitions
└── events.ts # Real-time event type definitions
```

#### Key Type Categories

1. **Event Types (`events.ts`)**
   - Pusher event enums
   - Message event types
   - User event types
   - Notification types

   ```typescript
   // Event enum example
   export enum PusherEvent {
     NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE',
     USER_TYPING = 'USER_TYPING',
     // ...
   }

   // Event type example
   export type MessageEvent = {
     id: string
     content: string
     channelId: string
     // ...
   }
   ```

2. **Database Types (`db.ts`)**
   - Table schemas
   - Relationship types
   - Query result types
   - Input/Output types

#### Type Organization

1. **Message-Related Types**
   - Base message structure
   - Channel messages
   - Direct messages
   - Thread replies

2. **User-Related Types**
   - User profiles
   - Authentication
   - Permissions
   - Status updates

3. **Channel-Related Types**
   - Channel structure
   - Membership
   - Settings
   - Permissions

4. **Notification Types**
   - Notification structure
   - Notification types
   - Read status
   - Notification data

#### Best Practices

1. **Type Definition**
   ```typescript
   // Use interfaces for extendable types
   export interface User {
     id: string
     name: string
     email: string
     role: UserRole
   }

   // Use type aliases for unions/intersections
   export type UserRole = 'admin' | 'member' | 'guest'
   ```

2. **Event Types**
   ```typescript
   // Base event type
   export type BaseEvent<T = unknown> = {
     type: PusherEvent
     timestamp: string
     data: T
   }

   // Specific event type
   export type MessageEvent = BaseEvent<{
     content: string
     senderId: string
   }>
   ```

3. **Utility Types**
   ```typescript
   // Partial type for updates
   export type UserUpdate = Partial<User>

   // Pick specific fields
   export type UserProfile = Pick<User, 'name' | 'email'>
   ```

#### Common Patterns

1. **Discriminated Unions**
   ```typescript
   type NotificationType = 
     | { type: 'mention'; userId: string }
     | { type: 'reply'; messageId: string }
     | { type: 'dm'; senderId: string }
   ```

2. **Generic Types**
   ```typescript
   export type Result<T> = {
     data?: T
     error?: string
     loading: boolean
   }
   ```

3. **Mapped Types**
   ```typescript
   export type Timestamps<T> = T & {
     createdAt: string
     updatedAt: string
   }
   ```

#### Usage Guidelines

1. **Type Safety**
   - Use strict type checking
   - Avoid type assertions
   - Leverage type inference
   - Document complex types

2. **Naming Conventions**
   - Use PascalCase for types/interfaces
   - Use descriptive names
   - Add type suffixes when appropriate
   - Group related types

3. **Documentation**
   - Add JSDoc comments
   - Explain complex types
   - Include examples
   - Document edge cases

4. **Organization**
   - Group related types
   - Use barrel exports
   - Maintain clear dependencies
   - Avoid circular references

See individual type files for detailed documentation of specific type definitions. 