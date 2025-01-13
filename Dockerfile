FROM node:20-alpine

WORKDIR /app

# Install netcat for connection checking
RUN apk add --no-cache netcat-openbsd

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Run in development mode
CMD ["npm", "run", "dev"] 