#!/bin/bash

# Traffic Management Platform - Development Setup Script
# This script sets up the development environment for the traffic platform

set -e  # Exit on any error

echo "🚦 Traffic Management Platform - Development Setup"
echo "=================================================="

# Check if Python 3.8+ is installed
python_version=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
required_version="3.8"

if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 8) else 1)" 2>/dev/null; then
    echo "❌ Python 3.8+ is required. Current version: $python_version"
    echo "Please install Python 3.8 or higher and try again."
    exit 1
fi

echo "✅ Python version: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p models
mkdir -p data/images
mkdir -p data/videos
mkdir -p tmp

# Download YOLO models
echo "🤖 Downloading YOLO models..."
python scripts/download_models.py

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "📝 Please update the .env file with your configuration"
fi

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    
    # Check if Docker Compose is installed
    if command -v docker-compose &> /dev/null; then
        echo "✅ Docker Compose is installed"
        
        echo "🐳 Starting development services (PostgreSQL + Redis)..."
        docker-compose -f docker-compose.dev.yml up -d traffic-db redis
        
        # Wait for services to be ready
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        
        # Check if services are healthy
        if docker-compose -f docker-compose.dev.yml ps | grep -q "healthy"; then
            echo "✅ Development services are running"
        else
            echo "⚠️  Services may still be starting up. Check with: docker-compose -f docker-compose.dev.yml ps"
        fi
    else
        echo "⚠️  Docker Compose not found. Please install Docker Compose to use containerized services."
    fi
else
    echo "⚠️  Docker not found. You'll need to set up PostgreSQL and Redis manually."
    echo "   Or install Docker to use the containerized development environment."
fi

# Run database initialization (if services are running)
echo "🗄️  Initializing database..."
if docker-compose -f docker-compose.dev.yml ps traffic-db | grep -q "Up"; then
    echo "Database will be initialized automatically via init.sql"
else
    echo "⚠️  Database service not running. Please start it manually or check Docker setup."
fi

# Create systemd service file (optional, for Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v systemctl &> /dev/null; then
    echo "🔧 Creating systemd service file (optional)..."
    cat > traffic-management.service << EOF
[Unit]
Description=Traffic Management Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PATH=$(pwd)/venv/bin
ExecStart=$(pwd)/venv/bin/python src/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    echo "📄 Service file created: traffic-management.service"
    echo "   To install: sudo cp traffic-management.service /etc/systemd/system/"
    echo "   To enable: sudo systemctl enable traffic-management"
    echo "   To start: sudo systemctl start traffic-management"
fi

# Run tests to verify setup
echo "🧪 Running tests to verify setup..."
if python -m pytest tests/ -v --tb=short; then
    echo "✅ All tests passed!"
else
    echo "⚠️  Some tests failed. This might be expected if external services aren't running."
fi

echo ""
echo "🎉 Development setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start the development server:"
echo "   source venv/bin/activate"
echo "   python src/main.py"
echo ""
echo "3. Or use Docker Compose for full stack:"
echo "   docker-compose -f docker-compose.dev.yml up"
echo ""
echo "4. Access the API at: http://localhost:3005"
echo "   Health check: http://localhost:3005/health"
echo ""
echo "Useful commands:"
echo "- Run tests: python -m pytest tests/"
echo "- Check services: docker-compose -f docker-compose.dev.yml ps"
echo "- View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "- Stop services: docker-compose -f docker-compose.dev.yml down"
echo ""
echo "📚 Documentation: See README.md for more information"