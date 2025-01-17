#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Set postgres password and database URL
export PGPASSWORD=postgres
export DATABASE_URL=postgres://postgres:postgres@db:5432/chatgenius

# Wait for database to be ready
until pg_isready -h db -U postgres; do
    echo "Waiting for postgres..."
    sleep 2
done

# Drop existing connections
psql -h db -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'chatgenius';"

# Drop and recreate database
dropdb -h db -U postgres --if-exists chatgenius
createdb -h db -U postgres chatgenius

# Run migrations
echo "Running migrations..."
npm run db:migrate

echo "Migrations completed successfully!" 