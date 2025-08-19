#!/bin/bash

# Online Forms Backend Deployment Script

echo "🚀 Starting deployment process..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run database migrations
echo "🗄️ Running database migrations..."
npm run migrate

# Seed initial data (only in development)
if [ "$NODE_ENV" != "production" ]; then
    echo "🌱 Seeding initial data..."
    npm run seed
fi

echo "✅ Deployment completed successfully!"
echo "🌐 API is ready to serve requests"