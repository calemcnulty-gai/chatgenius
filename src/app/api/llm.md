# API Routes Documentation

This directory contains all API routes for ChatGenius, implemented using Next.js App Router's Route Handlers. The API is organized by feature domains and follows RESTful principles.

## Directory Structure

```
api/
├── auth/         # Authentication and user sync
├── channels/     # Channel management
├── dm/           # Direct messaging
├── invites/      # Workspace invitations
├── messages/     # Message operations
├── notifications/# User notifications
├── pusher/       # Real-time events
├── rag/          # Retrieval-augmented generation
├── users/        # User management
├── webhooks/     # External service webhooks
└── workspaces/   # Workspace operations
```

## Route Patterns

1. **Resource Management**
   ```typescript
   // GET /api/workspaces
   export async function GET(req: Request) {
     const { userId } = auth()
     return Response.json(await getWorkspaces(userId))
   }

   // POST /api/workspaces
   export async function POST(req: Request) {
     const data = await req.json()
     return Response.json(await createWorkspace(data))
   }
   ```

2. **Authentication**
   ```typescript
   // All routes use Clerk authentication
   const { userId } = auth()
   if (!userId) {
     return new Response('Unauthorized', { status: 401 })
   }
   ```

3. **Error Handling**
   ```typescript
   try {
     // Operation
   } catch (error) {
     console.error('Operation failed:', error)
     return new Response('Error message', { 
       status: error.status || 500 
     })
   }
   ```

## Key Features

1. **Authentication (`/auth`)**
   - User synchronization
   - Session management
   - Profile updates

2. **Messaging (`/messages`, `/dm`)**
   - Message CRUD operations
   - Thread management
   - File attachments
   - Direct messaging

3. **Workspaces (`/workspaces`, `/channels`)**
   - Workspace management
   - Channel operations
   - Member management
   - Invitations

4. **Real-time (`/pusher`)**
   - Event broadcasting
   - Connection management
   - Presence handling
   - Heartbeat monitoring

5. **AI Features (`/rag`)**
   - Document retrieval
   - AI-powered responses
   - Context management
   - Knowledge base integration

## Best Practices

1. **Request Handling**
   - Validate input data
   - Use appropriate HTTP methods
   - Return consistent response formats
   - Include error details

2. **Authentication**
   - Verify user session
   - Check permissions
   - Validate workspace access
   - Handle expired tokens

3. **Performance**
   - Use appropriate caching
   - Optimize database queries
   - Handle rate limiting
   - Monitor response times

4. **Security**
   - Sanitize user input
   - Prevent CSRF attacks
   - Implement rate limiting
   - Log security events

## Common Patterns

1. **Response Format**
   ```typescript
   {
     data?: any        // Success response data
     error?: string    // Error message if applicable
     status: number    // HTTP status code
   }
   ```

2. **Permission Checking**
   ```typescript
   const workspace = await getWorkspace(workspaceId)
   if (!hasPermission(userId, workspace)) {
     return new Response('Forbidden', { status: 403 })
   }
   ```

3. **Data Validation**
   ```typescript
   const schema = z.object({
     name: z.string().min(1),
     description: z.string().optional()
   })
   const result = schema.safeParse(await req.json())
   if (!result.success) {
     return new Response('Invalid data', { status: 400 })
   }
   ```

See individual route directories for specific endpoint documentation. 