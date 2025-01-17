#!/bin/sh

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
npm run db:migrate

# Start the application based on NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
  echo "Starting in production mode..."
  npm run start
else
  echo "Starting in development mode..."
  npm run dev
fi 