FROM node:20-alpine AS builder
WORKDIR /app

# Install netcat for database connection checking
RUN apk add --no-cache netcat-openbsd

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy entrypoint script first and set permissions
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh && \
    dos2unix docker-entrypoint.sh 2>/dev/null || true

# Copy remaining codebase
COPY . .

# Build Next.js (will only be used in production)
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

# Runner stage (only used in production)
FROM node:20-alpine AS runner
WORKDIR /app

# Install netcat in runner stage too
RUN apk add --no-cache netcat-openbsd

# Copy necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/docker-entrypoint.sh ./

# Default to production, but can be overridden
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Use development target in dev mode, production target in prod mode
FROM builder AS final

ENTRYPOINT ["/bin/sh", "./docker-entrypoint.sh"] 