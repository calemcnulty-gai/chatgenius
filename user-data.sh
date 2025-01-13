#!/bin/bash

# Update system packages
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /app
cd /app

# Configure Docker to use ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 474668398195.dkr.ecr.us-east-1.amazonaws.com

# Create docker-compose.yml
cat > docker-compose.yml <<'EOL'
version: '3.8'
services:
  web:
    image: 474668398195.dkr.ecr.us-east-1.amazonaws.com/chatgenius:latest
    ports:
      - "80:3000"
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
    depends_on:
      - db
    restart: always

  db:
    image: postgres:15
    env_file:
      - .env.production
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

volumes:
  postgres_data:
EOL

# Create production environment file
cat > .env.production <<EOL
POSTGRES_PASSWORD=$(openssl rand -base64 32)
EOL

# Start the application
docker-compose up -d 