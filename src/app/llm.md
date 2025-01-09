### App Router Documentation

The `app/` directory implements Next.js 13+ App Router pattern, containing all pages, layouts, and API routes for ChatGenius.

#### Directory Structure

```
app/
├── api/           # API routes
├── invite/        # Workspace invitation flow
├── sign-in/       # Authentication - sign in
├── sign-up/       # Authentication - sign up
├── workspace/     # Workspace and channel views
├── globals.css    # Global styles
├── layout.tsx     # Root layout
└── page.tsx       # Landing page
```

#### Key Areas

1. **API Routes (`api/`)**
   - RESTful endpoints
   - WebSocket handling
   - Authentication middleware
   - Resource management

2. **Authentication (`sign-in/, sign-up/`)**
   - Clerk authentication integration
   - User onboarding
   - Session management
   - UserContext integration for client-side user data

3. **Workspace Management (`workspace/`)**
   - Workspace views
   - Channel management
   - Member interactions
   - Real-time updates
   - User data management through UserContext

4. **Invitation System (`invite/`)**
   - Workspace invitations
   - Email integration
   - Access management

#### Routing Patterns

1. **Dynamic Routes**
   ```
   workspace/[workspaceSlug]/           # Workspace view
   workspace/[workspaceSlug]/settings   # Workspace settings
   workspace/[workspaceSlug]/channel/[channelSlug]  # Channel view
   ```

2. **API Routes**
   ```
   api/workspaces/     # Workspace management
   api/channels/       # Channel operations
   api/messages/       # Message handling
   api/invites/        # Invitation management
   ```

#### Key Concepts

1. **Layouts**
   - Nested layouts for consistent UI
   - Shared navigation and context
   - Authentication boundaries
   - User context providers for data sharing

2. **Server Components**
   - Default to server components
   - Data fetching at the component level
   - SEO optimization
   - Initial user data hydration

3. **Client Components**
   - Interactive features
   - Real-time updates
   - Form handling
   - User context consumption

4. **Middleware**
   - Authentication checks
   - Route protection
   - Request/response transformation

#### State Management

1. **UserContext**
   - Centralized user data management
   - Client-side user state
   - Type-safe user information
   - Status management

2. **Data Flow**
   - Server components fetch initial data
   - Data passed through context providers
   - Client components consume context
   - Real-time updates through WebSocket

#### Best Practices

1. **Route Organization**
   - Group related functionality
   - Maintain clear hierarchy
   - Use appropriate HTTP methods

2. **Error Handling**
   - Implement error boundaries
   - Proper status codes
   - User-friendly error messages

3. **Performance**
   - Optimize loading states
   - Implement streaming where appropriate
   - Use proper caching strategies

4. **Security**
   - Validate all inputs
   - Implement proper CORS
   - Handle rate limiting

#### Common Patterns

1. **Page Component with User Context**
   ```typescript
   export default async function WorkspacePage({
     params
   }: {
     params: { workspaceSlug: string }
   }) {
     const user = await getUser()
     return (
       <UserProvider initialUser={user}>
         <WorkspaceClient>
           {/* Page content */}
         </WorkspaceClient>
       </UserProvider>
     )
   }
   ```

2. **API Route**
   ```typescript
   export async function POST(req: Request) {
     // Request handling
     return Response.json({ /* response */ })
   }
   ```

3. **Layout Component with Context**
   ```typescript
   export default function WorkspaceLayout({
     children
   }: {
     children: React.ReactNode
   }) {
     return (
       <UserProvider initialUser={user}>
         <div>
           <WorkspaceNav />
           {children}
         </div>
       </UserProvider>
     )
   }
   ```

See individual route directories for detailed documentation of specific features. 