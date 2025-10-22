#!/bin/bash

# eKYC Blockchain Setup Script
# Run this from the eKYC/blockchain directory

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo "=========================================="
echo "  eKYC Blockchain Setup"
echo "=========================================="
echo ""

# Check if in blockchain directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the blockchain directory"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your actual values before deployment"
fi

# Create directories
print_status "Creating necessary directories..."
mkdir -p deployments
mkdir -p test
mkdir -p contracts

# Check if contract exists
if [ ! -f "contracts/CredentialRegistry.sol" ]; then
    print_warning "CredentialRegistry.sol not found in contracts directory"
    print_warning "Please add your smart contract to contracts/CredentialRegistry.sol"
fi

# Compile contracts
print_status "Compiling smart contracts..."
npx hardhat compile

print_status "Blockchain setup complete!"
echo ""
echo "=========================================="
echo "  Next Steps"
echo "=========================================="
echo "1. Edit .env file with your configuration"
echo "2. Add CredentialRegistry.sol to contracts/"
echo "3. Start local node: npm run node"
echo "4. Deploy locally: npm run deploy:local"
echo "5. Setup issuers: npm run setup:local"
echo ""
echo "For Sepolia testnet:"
echo "1. npm run deploy:sepolia"
echo "2. npm run setup:sepolia"
echo "=========================================="