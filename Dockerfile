FROM node:20-alpine AS builder

WORKDIR /app

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true

# Copy package files and env
COPY package*.json .env ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

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

# Copy package files and env
COPY package*.json .env ./

# Install production dependencies only
RUN npm ci --only=production

# Create uploads directory
RUN mkdir -p public/uploads

# Copy built application and generated types
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 