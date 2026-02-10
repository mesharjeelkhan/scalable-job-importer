#!/bin/bash

# Scalable Job Importer - Quick Setup Script

echo "🚀 Setting up Scalable Job Importer..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm is not installed. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js and npm found${NC}"

# Ask user for setup type
echo ""
echo "Select setup type:"
echo "1) Local development (requires MongoDB and Redis locally)"
echo "2) Docker Compose (recommended - includes all services)"
read -p "Enter choice [1-2]: " setup_choice

if [ "$setup_choice" == "2" ]; then
    # Docker setup
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}Docker is not installed. Please install Docker.${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Starting services with Docker Compose...${NC}"
    docker-compose up -d
    
    echo -e "${GREEN}✓ All services started!${NC}"
    echo ""
    echo "Services running:"
    echo "- Frontend: http://localhost:3000"
    echo "- Backend: http://localhost:5000"
    echo "- MongoDB: localhost:27017"
    echo "- Redis: localhost:6379"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    
else
    # Local setup
    echo -e "${BLUE}Setting up backend...${NC}"
    cd server
    
    if [ ! -f .env ]; then
        echo -e "${YELLOW}Creating .env file from .env.example${NC}"
        cp .env.example .env
        echo -e "${GREEN}✓ Please edit server/.env with your configuration${NC}"
    fi
    
    npm install
    npm run build
    
    cd ..
    
    echo -e "${BLUE}Setting up frontend...${NC}"
    cd client
    
    if [ ! -f .env.local ]; then
        echo -e "${YELLOW}Creating .env.local file${NC}"
        cp .env.example .env.local
    fi
    
    npm install
    
    cd ..
    
    echo -e "${GREEN}✓ Setup complete!${NC}"
    echo ""
    echo "To start the application:"
    echo "1. Start MongoDB (port 27017)"
    echo "2. Start Redis (port 6379)"
    echo "3. Terminal 1: cd server && npm run dev"
    echo "4. Terminal 2: cd client && npm run dev"
    echo ""
    echo "Application will be available at:"
    echo "- Frontend: http://localhost:3000"
    echo "- Backend: http://localhost:5000"
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
