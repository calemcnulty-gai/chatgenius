FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and env
COPY package*.json .env ./

# Install dependencies including TypeScript
RUN npm ci && npm install typescript @types/node

# Copy application files
COPY . .

# Build application and compile migrations
RUN npm run build && \
    mkdir -p dist && \
    echo "Compiling migrations..." && \
    npx tsc src/db/migrate.ts --outDir dist --esModuleInterop true --skipLibCheck true --module commonjs && \
    ls -la dist && \
    cat dist/migrate.js

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and env
COPY package*.json .env ./

# Install production dependencies
RUN npm ci --production

# Create uploads directory
RUN mkdir -p public/uploads

# Copy built application and migrations
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 