#!/bin/bash

# BhaMail Setup Script
# This script sets up the development environment for BhaMail

set -e

echo "🚀 Setting up BhaMail development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p api/logs
mkdir -p keys
mkdir -p backups
mkdir -p uploads

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

# Install dependencies
echo "📦 Installing API dependencies..."
cd api && npm install && cd ..

echo "📦 Installing Web dependencies..."
cd web && npm install && cd ..

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis minio opensearch mailhog clamav

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️  Running database migrations..."
cd api && npm run migrate && cd ..

# Generate DKIM keys
echo "🔐 Generating DKIM keys..."
./scripts/generate-dkim-keys.sh

# Seed database
echo "🌱 Seeding database with sample data..."
cd api && npm run seed && cd ..

echo "✅ Setup complete!"
echo ""
echo "🎉 BhaMail is ready to use!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the API server: npm run dev:api"
echo "   2. Start the web server: npm run dev:web"
echo "   3. Open http://localhost:3000 in your browser"
echo "   4. Login with admin@bhamail.local / password"
echo ""
echo "📊 Service URLs:"
echo "   • Web UI: http://localhost:3000"
echo "   • API: http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo "   • MailHog: http://localhost:8025"
echo "   • MinIO Console: http://localhost:9001"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Reset database: docker-compose down -v && ./scripts/setup.sh"