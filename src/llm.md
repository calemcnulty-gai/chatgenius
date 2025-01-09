### Source Code Organization

The `src/` directory contains the main application code for ChatGenius, organized into logical subdirectories based on functionality.

#### Directory Structure

```
src/
├── app/        # Next.js App Router pages and API routes
├── components/ # Reusable React components
├── contexts/   # React context providers
├── db/         # Database models and queries
├── hooks/      # Custom React hooks
├── lib/        # Utility functions and external service integrations
├── styles/     # Global styles and Tailwind CSS configuration
└── types/      # TypeScript type definitions
```

#### Key Concepts

1. **App Router (`app/`)**
   - Uses Next.js 14 App Router for routing and layouts
   - API routes for backend functionality
   - Server components for improved performance

2. **Components (`components/`)**
   - Organized by feature (workspace, channel, chat)
   - Shared UI components
   - Client-side interactivity

3. **Database (`db/`)**
   - Database schema and migrations
   - Query utilities
   - Type-safe database access

4. **Contexts (`contexts/`)**
   - Global state management
   - Feature-specific contexts
   - Authentication state

5. **Hooks (`hooks/`)**
   - Real-time communication hooks
   - Data fetching
   - UI state management

6. **Library (`lib/`)**
   - External service integrations (Pusher, OpenAI)
   - Utility functions
   - Constants and configuration

7. **Types (`types/`)**
   - Shared TypeScript interfaces
   - API response types
   - Database model types

#### Code Organization Rules

1. Keep components focused and single-responsibility
2. Use server components by default, client components when needed
3. Maintain clear separation between UI and business logic
4. Keep database operations isolated in db/ directory
5. Share common functionality through hooks and utilities

See individual directory llm.md files for detailed documentation of each subsystem. 