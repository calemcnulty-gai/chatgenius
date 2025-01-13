FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and env
COPY package*.json .env ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files and env
COPY package*.json .env ./

# Install production dependencies only
RUN npm ci --production

# Create uploads directory
RUN mkdir -p public/uploads

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 