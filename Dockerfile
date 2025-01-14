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

# Build with full type checking output
RUN npm run build \
    --loglevel verbose \
    -- \
    --debug \
    --trace-warnings \
    2>&1 | tee build.log || (cat build.log && exit 1)

# Production image
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy package files and env
COPY package*.json .env ./

# Install production dependencies
RUN npm ci --production

# Create uploads directory
RUN mkdir -p public/uploads

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 3000

# Run migrations and start
CMD sh -c "npm run db:migrate && npm start" 