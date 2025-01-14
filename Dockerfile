FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and env
COPY package*.json .env ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build with npm verbose logs + Next debug logs
# Notice we changed the command:
RUN npm --loglevel=verbose run build -- --debug

# Production image
FROM node:20-alpine

WORKDIR /app

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

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Expose port
EXPOSE 3000

# Run migrations and start
CMD sh -c "npm run db:migrate && npm start" 