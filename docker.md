# Docker Architecture for ChatGenius

Below is a streamlined approach to Dockerizing ChatGenius that aligns with your requirements. This design reduces complexity while ensuring a reliable setup for both development and production needs.

---

## Overview

We’ll only have two containers:

1. **db** (persistent)  
   - Runs PostgreSQL.  
   - Stores data in a named volume.

2. **web** (persistent, but also used as an ephemeral container to run tasks)  
   - Node-based multi-stage build.  
   - Runs Next.js in either dev (hot reload) or production mode.  
   - Handles migrations via one-off commands.

No additional “setup” or “migrations” containers are necessary. Migrations run in the “web” container as ephemeral tasks when needed.

---

## Dockerfile (Multi-Stage)

Below is a sample Dockerfile that can handle both development and production:

    # 1) Builder stage
    FROM node:20-alpine AS builder
    WORKDIR /app

    # Optional: Install OS packages if needed
    # RUN apk add --no-cache ...

    # Copy package files
    COPY package*.json ./
    # Install dependencies
    RUN npm ci

    # Copy entire codebase
    COPY . .

    # (Optional) Generate Drizzle types or other build steps:
    # RUN npm run db:generate

    # Use an ARG to differentiate build modes
    ARG BUILD_ENV=production
    ENV NODE_ENV=$BUILD_ENV

    # Build Next.js in production mode by default
    RUN npm run build

    # 2) Runner stage
    FROM node:20-alpine AS runner
    WORKDIR /app

    # Copy build artifacts & node_modules from builder
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/public ./public

    # By default, consider environment production
    ENV NODE_ENV=production

    # Expose the standard Next.js port
    EXPOSE 3000

    CMD ["npm", "run", "start"]

---

## docker-compose.yml

Below is a minimal docker-compose file to coordinate the “db” and “web” services:

    version: "3.9"

    services:
      db:
        image: postgres:15
        container_name: db
        env_file:
          - .env
        environment:
          POSTGRES_USER: ${POSTGRES_USER}
          POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
          POSTGRES_DB: ${POSTGRES_DB}
        volumes:
          - pg_data:/var/lib/postgresql/data
        ports:
          - "5432:5432"
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
          interval: 5s
          timeout: 5s
          retries: 5

      web:
        build:
          context: .
          dockerfile: Dockerfile
          args:
            BUILD_ENV: ${BUILD_ENV:-production}
        container_name: web
        env_file:
          - .env
        depends_on:
          db:
            condition: service_healthy
        ports:
          - "3000:3000"
        volumes:
          # In development, you can mount source code for hot reloading:
          - .:/app
        command: >
          sh -c "
          if [ ${NODE_ENV} = 'development' ]; then
            echo 'Running in dev mode (hot reload)...' &&
            npm run dev
          else
            echo 'Running in production mode...' &&
            npm run start
          fi
          "

    volumes:
      pg_data:

---

## Key Operations

1. **Production Build & Run**  
   - By default, we build for production.  
   - Fresh build and start:
     
         docker-compose up --build
     
   - This will create/update images and run both the “db” and “web” containers in production mode.

2. **Development Mode (Hot Reloading)**  
   - Pass in build args for a dev environment:
     
         BUILD_ENV=development docker-compose up --build
     
   - The “web” service runs npm run dev, and local project files are mounted as volumes for easy edits.

3. **Run Migrations**  
   - Run migrations as a one-off task using the same “web” image:
     
         docker-compose run web npm run db:migrate
     
   - No separate “migrations” container needed; it uses the existing environment.

4. **Clean Everything**  
   - Stop and remove containers, images, volumes:
     
         docker-compose down --rmi all -v
     
   - This fully wipes out containers, images, and the pg_data volume.

5. **Data Persistence**  
   - The “db” service stores data in the named volume pg_data.  
   - It persists between restarts unless you remove volumes explicitly with -v or use docker volume prune.

---

## Why This Setup?

1. **Simplicity**: Only two services: db and web.  
2. **Flexibility**: Dev vs. prod is toggled by environment variables.  
3. **Ephemeral Migrations**: Run with docker-compose run web npm run db:migrate.  
4. **Persistent Data**: Named volume ensures data is retained.  
5. **Clean Command**: “docker-compose down --rmi all -v” removes everything for a totally fresh state.

---

## Optional Adjustments

- **Nginx / Reverse Proxy**: If you need SSL termination or reverse proxy features, add another service.  
- **Mount Node Modules**: In dev, you might tweak volumes for node_modules.  
- **Separate Compose Files**: If you want separate dev/prod compose files, you can do that; it’s optional.

---

## Summary

With this configuration, you have:
- A single Dockerfile and a single docker-compose.yml.  
- A simple, robust architecture for both development and production.  
- Easy commands for migrations, data management, and a full wipe.  
- Persistent data stored in a named volume unless explicitly removed.