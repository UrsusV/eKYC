#!/bin/bash

# eKYC System - Startup Script
# This script starts all required services for the eKYC system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          eKYC Blockchain System - Startup Script          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting eKYC services...${NC}"
echo ""

# Step 1: Start Docker services
echo -e "${BLUE}[1/4] Starting Docker services (MongoDB + Redis)...${NC}"
docker-compose up -d mongodb redis mongo-express redis-commander

# Wait for MongoDB and Redis to be ready
echo -e "${YELLOW}Waiting for MongoDB to be ready...${NC}"
timeout 30 bash -c 'until docker exec ekyc_mongodb mongosh --quiet --eval "db.adminCommand(\"ping\")" > /dev/null 2>&1; do sleep 1; done' || {
    echo -e "${RED}✗ MongoDB failed to start${NC}"
    exit 1
}
echo -e "${GREEN}✓ MongoDB is ready${NC}"

echo -e "${YELLOW}Waiting for Redis to be ready...${NC}"
timeout 30 bash -c 'until docker exec ekyc_redis redis-cli -a eKYC_Redis_2025 ping 2>/dev/null | grep -q PONG; do sleep 1; done' || {
    echo -e "${RED}✗ Redis failed to start${NC}"
    exit 1
}
echo -e "${GREEN}✓ Redis is ready${NC}"
echo ""

# Step 2: Check if blockchain dependencies are installed
echo -e "${BLUE}[2/4] Checking blockchain dependencies...${NC}"
if [ ! -d "blockchain/node_modules" ]; then
    echo -e "${YELLOW}Installing blockchain dependencies...${NC}"
    cd blockchain
    npm install
    cd ..
    echo -e "${GREEN}✓ Blockchain dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Blockchain dependencies already installed${NC}"
fi
echo ""

# Step 3: Check if backend dependencies are installed
echo -e "${BLUE}[3/4] Checking backend dependencies...${NC}"
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi
echo ""

# Step 4: Show instructions for manual steps
echo -e "${BLUE}[4/4] Services started successfully!${NC}"
echo ""
echo -e "${GREEN}✓ Docker services are running:${NC}"
echo -e "  - MongoDB:          ${BLUE}mongodb://localhost:27017${NC}"
echo -e "  - Redis:            ${BLUE}redis://localhost:6379${NC}"
echo -e "  - Mongo Express:    ${BLUE}http://localhost:8081${NC} (admin/admin123)"
echo -e "  - Redis Commander:  ${BLUE}http://localhost:8082${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo -e "${YELLOW}1. Start Hardhat blockchain node:${NC}"
echo -e "   cd blockchain && npm run node"
echo ""
echo -e "${YELLOW}2. Deploy smart contracts (in a new terminal):${NC}"
echo -e "   cd blockchain && npm run deploy:local"
echo ""
echo -e "${YELLOW}3. Start backend server (in a new terminal):${NC}"
echo -e "   cd backend && npm run dev"
echo ""
echo -e "${YELLOW}4. Run the demo flow (optional):${NC}"
echo -e "   node scripts/demo-flow.js"
echo ""
echo -e "${YELLOW}5. Run tests (optional):${NC}"
echo -e "   cd backend && npm test"
echo ""
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo -e "${GREEN}To stop all services:${NC}"
echo -e "  docker-compose down"
echo ""
echo -e "${GREEN}To view logs:${NC}"
echo -e "  docker-compose logs -f"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
