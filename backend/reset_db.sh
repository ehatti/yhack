#!/bin/bash

# Script to reset the SQLite database
# Deletes the existing database and runs migrations to recreate it

set -e  # Exit on error

echo "🗑️  Removing existing database..."
rm -f database.db

touch database.db

echo "📦 Running migrations..."
sqlx migrate run

echo "✅ Database reset complete!"
