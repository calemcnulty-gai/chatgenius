### ChatGenius Project Overview

ChatGenius is a Slack-like real-time messaging application built with Next.js that incorporates AI tools to enhance team communication. This document explains the codebase organization and architecture.

#### Project Structure

```
chatgenius/
├── src/               # Main application source code
├── prisma/            # Database schema and migrations
├── public/            # Static assets
├── .env              # Environment variables
├── next.config.js    # Next.js configuration
├── package.json      # Dependencies and scripts
├── tailwind.config.ts # Tailwind CSS configuration
└── tsconfig.json     # TypeScript configuration
```

#### Key Technologies

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Real-time**: WebSocket/Pusher
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI

#### Core Features

1. Real-time messaging in channels
2. Workspace and channel management
3. AI-powered features (summarization, reply generation, search)
4. User roles and permissions
5. Direct messaging

#### Configuration Files

- `next.config.js`: Next.js-specific configuration including redirects and environment variables
- `tailwind.config.ts`: Tailwind CSS theme and plugin configuration
- `tsconfig.json`: TypeScript compiler options and path aliases
- `drizzle.config.ts`: Database ORM configuration
- `.env`: Environment variables (not tracked in git)

#### Development Workflow

1. Install dependencies: `npm install`
2. Set up environment variables
3. Run database migrations
4. Start development server: `npm run dev`

#### Code Organization Principles

1. Feature-based organization within src/
2. Shared components in components/
3. Database logic isolated in db/
4. Type definitions in types/
5. Utility functions in lib/
6. Custom hooks in hooks/
7. Context providers in contexts/

See individual directory llm.md files for detailed documentation of each subsystem. 