#!/bin/bash

###############################################################################
# Test Environment Setup Script
# This script sets up the complete testing environment for E2E tests
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        eKYC Backend - Test Environment Setup             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if Docker is running
print_info "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi
print_status "Docker is running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed"
    exit 1
fi
print_status "Docker Compose is available"

# Stop any existing containers
print_info "Stopping existing containers..."
cd "$(dirname "$0")/../.." || exit
docker-compose down 2>/dev/null || true
print_status "Existing containers stopped"

# Start MongoDB and Redis
print_info "Starting MongoDB and Redis containers..."
docker-compose up -d mongodb redis
print_status "MongoDB and Redis started"

# Wait for MongoDB to be ready
print_info "Waiting for MongoDB to be ready..."
timeout 30 bash -c 'until docker exec ekyc_mongodb mongosh --quiet --eval "db.adminCommand({ping: 1})" > /dev/null 2>&1; do sleep 1; done' || {
    print_error "MongoDB failed to start within 30 seconds"
    exit 1
}
print_status "MongoDB is ready"

# Wait for Redis to be ready
print_info "Waiting for Redis to be ready..."
timeout 30 bash -c 'until docker exec ekyc_redis redis-cli -a eKYC_Redis_2025 ping > /dev/null 2>&1; do sleep 1; done' || {
    print_error "Redis failed to start within 30 seconds"
    exit 1
}
print_status "Redis is ready"

# Check if Hardhat blockchain is needed
if [ "$1" == "--with-blockchain" ] || [ "$1" == "-b" ]; then
    print_info "Starting Hardhat blockchain node..."

    # Check if hardhat directory exists
    if [ ! -d "blockchain" ]; then
        print_error "Blockchain directory not found. Skipping blockchain setup."
    else
        cd blockchain || exit

        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            print_info "Installing blockchain dependencies..."
            npm install
        fi

        # Start Hardhat node in background
        print_info "Starting Hardhat local node..."
        npx hardhat node > /tmp/hardhat.log 2>&1 &
        HARDHAT_PID=$!
        echo $HARDHAT_PID > /tmp/hardhat.pid

        # Wait for Hardhat to start
        sleep 5

        # Deploy contracts
        print_info "Deploying smart contracts..."
        npx hardhat run scripts/deploy.js --network localhost
        print_status "Smart contracts deployed"

        cd ..
        print_status "Hardhat blockchain is running (PID: $HARDHAT_PID)"
        print_warning "Hardhat logs: /tmp/hardhat.log"
    fi
fi

# Check if backend dependencies are installed
print_info "Checking backend dependencies..."
cd backend || exit
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
fi
print_status "Backend dependencies ready"

# Clear test database (optional)
if [ "$2" == "--clean-db" ] || [ "$1" == "--clean-db" ]; then
    print_info "Cleaning test database..."
    docker exec ekyc_mongodb mongosh ekyc_test_db --quiet --eval "db.dropDatabase()" > /dev/null 2>&1 || true
    print_status "Test database cleaned"
fi

# Create test .env if it doesn't exist
if [ ! -f ".env.test" ]; then
    print_info "Creating .env.test file..."
    cat > .env.test << 'EOF'
NODE_ENV=test
PORT=5001

# MongoDB (Docker)
MONGODB_URI=mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_test_db?authSource=admin

# Redis (Docker)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=eKYC_Redis_2025

# JWT
JWT_SECRET=test-jwt-secret-key-change-in-production-12345
JWT_REFRESH_SECRET=test-jwt-refresh-secret-key-change-in-production-67890
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Blockchain
BLOCKCHAIN_PROVIDER_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# API
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=1000
EOF
    print_status ".env.test created"
else
    print_status ".env.test already exists"
fi

echo ""
print_status "Test environment setup complete!"
echo ""
print_info "Services Status:"
echo "  • MongoDB:    ${GREEN}Running${NC} (localhost:27017)"
echo "  • Redis:      ${GREEN}Running${NC} (localhost:6379)"

if [ "$1" == "--with-blockchain" ] || [ "$1" == "-b" ]; then
    echo "  • Hardhat:    ${GREEN}Running${NC} (localhost:8545)"
fi

echo ""
print_info "Next Steps:"
echo "  1. Run unit tests:        npm test"
echo "  2. Run integration tests: npm run test:integration"
echo "  3. Run E2E tests:         npm run test:e2e"
echo "  4. Run demo flow:         npm run demo"
echo ""
print_warning "To stop services:"
echo "  Docker: docker-compose down"
if [ "$1" == "--with-blockchain" ] || [ "$1" == "-b" ]; then
    echo "  Hardhat: kill \$(cat /tmp/hardhat.pid)"
fi
echo ""
