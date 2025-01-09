### Components Documentation

The `components/` directory contains all React components used in ChatGenius, organized by feature and functionality. Components are structured to promote reusability and maintainability.

#### Directory Structure

```
components/
├── chat/          # Message-related components
├── channel/       # Channel view and management
├── layout/        # Layout components and structure
├── notifications/ # Notification system components
├── providers/     # Context providers and wrappers
├── thread/        # Thread and reply components
├── ui/           # Shared UI components
└── workspace/    # Workspace management components
```

#### Component Categories

1. **Chat Components (`chat/`)**
   - Message composition
   - Message display
   - Message actions (edit, delete, react)
   - AI integration UI

2. **Channel Components (`channel/`)**
   - Channel header
   - Channel settings
   - Member management
   - Channel creation/editing

3. **Layout Components (`layout/`)**
   - Page layouts
   - Navigation structure
   - Responsive containers
   - Common layouts

4. **Notification Components (`notifications/`)**
   - Toast notifications
   - Alert systems
   - Status indicators

5. **Provider Components (`providers/`)**
   - Theme provider
   - Authentication wrapper
   - Real-time connection provider
   - Global state providers

6. **Thread Components (`thread/`)**
   - Thread view
   - Reply composition
   - Thread navigation

7. **UI Components (`ui/`)**
   - Buttons
   - Inputs
   - Modals
   - Common UI elements

8. **Workspace Components (`workspace/`)**
   - Workspace navigation
   - Member management
   - Settings panels
   - Channel list

#### Component Guidelines

1. **Component Structure**
   ```typescript
   // Example component structure
   export function ChannelHeader({ 
     channel,
     onSettingsClick 
   }: ChannelHeaderProps) {
     // Component logic
     return (
       // JSX
     )
   }
   ```

2. **Best Practices**
   - Use TypeScript for type safety
   - Implement proper prop validation
   - Keep components focused and single-responsibility
   - Use composition over inheritance
   - Implement error boundaries where appropriate

3. **State Management**
   - Use hooks for local state
   - Context for shared state
   - Props for component communication
   - Avoid prop drilling

4. **Performance**
   - Implement proper memoization
   - Use lazy loading when appropriate
   - Optimize re-renders
   - Handle loading states

#### Common Patterns

1. **Client Components**
   ```typescript
   'use client'
   
   export function InteractiveComponent() {
     // Client-side logic
   }
   ```

2. **Server Components**
   ```typescript
   export async function StaticComponent() {
     // Server-side logic
   }
   ```

3. **Component Composition**
   ```typescript
   export function ChannelView() {
     return (
       <ChannelLayout>
         <ChannelHeader />
         <MessageList />
         <MessageInput />
       </ChannelLayout>
     )
   }
   ```

See individual component directories for detailed documentation of specific features. 