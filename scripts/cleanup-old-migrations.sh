#!/bin/bash

# Create backup directory
mkdir -p src/db/migrations.bak

# Move all TypeScript migration files to backup
mv src/db/migrations/*.ts src/db/migrations.bak/

# Move data directory to backup
mv src/db/migrations/data src/db/migrations.bak/

# Create a new data directory
mkdir -p src/db/migrations/data

# Create a symlink to the new data location
ln -s ../../drizzle/data/* src/db/migrations/data/

echo "Old migrations have been moved to src/db/migrations.bak"
echo "A symlink to the new data location has been created in src/db/migrations/data" 