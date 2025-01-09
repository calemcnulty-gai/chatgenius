# UI Components

This directory contains reusable UI components used throughout the ChatGenius application.

## Components Overview

### Skeleton
A component that provides loading state placeholders that match the shape of the content being loaded.

Props:
- `className`: Additional CSS classes for customizing dimensions and appearance

Features:
- Animated pulse effect
- Dark mode support
- Customizable dimensions
- Maintains layout stability
- Reduces perceived loading time

Usage:
```tsx
// Basic usage with custom dimensions
<Skeleton className="h-4 w-24" />

// Avatar placeholder
<Skeleton className="h-10 w-10 rounded-full" />

// Text block placeholder
<Skeleton className="h-4 w-full" />

// Complex content placeholder
<div className="space-y-2">
  <Skeleton className="h-6 w-1/3" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-2/3" />
</div>
```

Key features:
- Maintains visual hierarchy during loading
- Prevents layout shifts
- Provides immediate visual feedback
- Scales to any content shape
- Consistent with design system
- Improves perceived performance

### UserDisplay
A versatile component for displaying user information consistently across the application.

Variants:
- `text`: Simple text display of user's name (prefers displayName if set)
- `text-with-status`: Text display with online status indicator
- `full`: Complete user display with avatar, name, title, and status

Props:
- `user`: User object containing all user data
- `variant`: Display variant (default: 'text')
- `className`: Additional CSS classes
- `showLoadingState`: Whether to show loading skeletons (default: true)

Usage:
```tsx
// Simple text display
<UserDisplay user={user} />

// With status and loading states disabled
<UserDisplay 
  user={user} 
  variant="text-with-status"
  showLoadingState={false}
/>

// Full display with all user info
<UserDisplay 
  user={user} 
  variant="full" 
  className="my-custom-class"
/>
```

Key features:
- Consistent user name display logic (prefers displayName over name)
- Multiple display variants for different contexts
- Loading state handling with skeletons
- Error handling for images
- Customizable loading state behavior
- Responsive to UserContext states
- Uses cn utility for class merging
- Graceful fallbacks for missing data

States:
- Normal: Displays user information based on variant
- Loading: Shows appropriate skeleton based on variant
- Error: Falls back to initials for images
- Interactive: Maintains accessibility during state changes

Integration:
- Uses UserContext for loading states
- Handles image loading errors
- Consistent styling across states
- Maintains layout stability during loading

## UserAvatar

The `UserAvatar` component displays user avatars and handles profile modal interactions. It uses `UserContext` to determine if the displayed user is the current user and manage loading states.

### Props
- `user`: User object to display
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `onClick`: Optional click handler
- `className`: Optional additional CSS classes

### Features
- Displays user avatar with fallback states:
  - Profile image if available
  - Initials fallback if no image
  - Loading skeleton during context updates
  - Error fallback if image fails to load
- Integrates with profile modals
- Smart handling of current user vs other users
- Loading state management
- Error handling for image loading
- Customizable appearance
- Responsive to UserContext states

### Usage
```tsx
<UserAvatar
  user={user}
  size="md"
  className="custom-class"
  onClick={handleClick}
/>
```

### States
- Normal: Displays user avatar or initials
- Loading: Shows animated skeleton
- Error: Falls back to initials
- Interactive: Opens appropriate profile modal

### Integration
- Uses UserContext for:
  - Loading states
  - Current user detection
  - Profile modal selection
- Handles image loading errors gracefully
- Respects loading states in click handling 

### Shared UI Components

This directory contains reusable UI components that are shared across different features of the ChatGenius application.

#### Component Categories

1. **User Components**
   - `UserAvatar`: Displays user profile images with status indicators
   - `UserDisplay`: Shows user names and additional information

2. **Input Components**
   - `MessageInput`: Universal message input component used across channels, DMs, and threads
     - Handles message submission
     - Supports parent messages for threads
     - Context-agnostic (works in any messaging context)
     - Props:
       - `channelId`: Target channel identifier
       - `parentMessageId`: Optional parent message for threads
       - `onMessageSent`: Callback after successful message send
       - `placeholder`: Custom input placeholder
       - `className`: Additional styling classes

3. **Layout Components**
   - `Skeleton`: Loading state placeholders
   - Modal base components
   - Common layout structures

4. **Interactive Elements**
   - Buttons
   - Form controls
   - Interactive overlays

#### Usage Guidelines

1. **Component Structure**
   ```typescript
   export function ComponentName({ 
     required,
     optional = defaultValue 
   }: Props) {
     // Component logic
   }
   ```

2. **Best Practices**
   - Keep components focused and single-responsibility
   - Use TypeScript for type safety
   - Implement proper prop validation
   - Use composition over inheritance
   - Handle loading and error states

3. **Styling**
   - Use Tailwind CSS classes
   - Support className prop for customization
   - Follow dark theme patterns
   - Maintain consistent spacing

4. **State Management**
   - Use hooks for local state
   - Accept callbacks for parent communication
   - Handle loading states
   - Proper error handling

See individual components for detailed implementation examples. 