#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Validate NEXT_PUBLIC_ENVIRONMENT
if [ "$NEXT_PUBLIC_ENVIRONMENT" != "development" ] && [ "$NEXT_PUBLIC_ENVIRONMENT" != "production" ]; then
    echo "Error: NEXT_PUBLIC_ENVIRONMENT must be either 'development' or 'production'"
    exit 1
fi

# Set compose file based on environment
if [ "$NEXT_PUBLIC_ENVIRONMENT" = "development" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
else
    COMPOSE_FILE="docker-compose.yml"
fi

# Handle command line arguments
COMMAND=${1:-"up"}  # Default to "up" if no command provided

case "$COMMAND" in
    "up")
        echo "Starting containers in $NEXT_PUBLIC_ENVIRONMENT mode..."
        docker-compose -f $COMPOSE_FILE up --build
        ;;
    "down")
        echo "Stopping containers..."
        docker-compose -f $COMPOSE_FILE down
        ;;
    "build")
        echo "Running build process in $NEXT_PUBLIC_ENVIRONMENT mode..."
        # First run migrations
        echo "Running migrations..."
        docker-compose -f $COMPOSE_FILE up -d db
        sleep 5  # Give DB time to start
        docker-compose -f $COMPOSE_FILE up --exit-code-from migrations migrations
        
        # Then build the Next.js application
        echo "Building Next.js application..."
        if [ "$NEXT_PUBLIC_ENVIRONMENT" = "development" ]; then
            docker-compose -f $COMPOSE_FILE run --rm web npm run build
        else
            docker-compose -f $COMPOSE_FILE build web
        fi
        
        # Clean up
        docker-compose -f $COMPOSE_FILE down
        echo "Build process complete."
        ;;
    "clean")
        echo "Stopping containers and removing volumes..."
        docker-compose -f $COMPOSE_FILE down -v
        echo "Removing all unused volumes..."
        docker volume prune -f
        echo "Clean complete. All volumes have been removed."
        ;;
    *)
        echo "Usage: $0 [up|down|build|clean]"
        exit 1
        ;;
esac 