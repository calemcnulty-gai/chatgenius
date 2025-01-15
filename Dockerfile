FROM node:20-alpine AS builder

WORKDIR /app

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Copy env file (after main copy to ensure it's not overwritten)
COPY .env ./

# Generate Drizzle types
RUN npm run db:generate

# Build the application
RUN set -ex; \
    npm run build \
    2>&1 | tee build.log; \
    if [ ! -d .next ]; then \
        echo "Build failed - .next directory not created"; \
        cat build.log; \
        exit 1; \
    fi

# Production image
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Create uploads directory
RUN mkdir -p public/uploads

# Copy built application and all necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/.env ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 