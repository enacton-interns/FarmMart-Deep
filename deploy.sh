#!/bin/bash

# FarmMarket Deployment Script

set -e

echo "🚀 Starting FarmMarket deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ssl
mkdir -p logs

# Check if SSL certificates exist
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "⚠️ SSL certificates not found. You can generate self-signed certificates for development:"
    echo "   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem"
    echo "   For production, use certificates from a trusted CA like Let's Encrypt."
    echo ""
fi

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Run database migrations if needed
echo "🔄 Running database migrations..."
docker-compose exec app npm run migrate

# Show logs
echo "📋 Showing recent logs..."
docker-compose logs --tail=50 app

echo "✅ Deployment completed successfully!"
echo "🌐 FarmMarket is now running at: http://localhost (or https://yourdomain.com if configured)"
echo ""
echo "📊 To view logs, run: docker-compose logs -f [service]"
echo "🛑 To stop services, run: docker-compose down"
echo "🔄 To restart services, run: docker-compose restart"