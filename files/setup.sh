#!/bin/bash

# CredentialRegistry Test Suite - Setup Script
# This script sets up the project structure for running tests

echo "🚀 Setting up CredentialRegistry Test Suite..."

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p contracts
mkdir -p test
mkdir -p scripts

# Move files to correct locations
echo "📦 Organizing files..."
mv CredentialRegistry.sol contracts/ 2>/dev/null || echo "CredentialRegistry.sol already in place or will be created"
mv CredentialRegistry.test.js test/ 2>/dev/null || echo "Test file already in place"

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
node_modules
.env
coverage
coverage.json
typechain
typechain-types

# Hardhat files
cache
artifacts

# Hardhat Network
.hardhat-network-helpers.json

# Gas reports
gas-report.txt

# Coverage
.coverage_artifacts
.coverage_cache
.coverage_contracts

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF

# Create .env.example
echo "🔐 Creating .env.example..."
cat > .env.example << 'EOF'
# Gas Reporter (optional)
REPORT_GAS=false
COINMARKETCAP_API_KEY=your_api_key_here

# Network Configuration (for future deployment)
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
EOF

# Install dependencies
echo "📥 Installing dependencies..."
if command -v npm &> /dev/null; then
    echo "Installing npm packages..."
    npm install
else
    echo "⚠️  npm not found. Please install Node.js and npm first."
    exit 1
fi

# Create OpenZeppelin contracts reference
echo "📚 Note: Make sure OpenZeppelin contracts are installed..."
npm install @openzeppelin/contracts 2>/dev/null || echo "OpenZeppelin contracts installation skipped"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Ensure CredentialRegistry.sol is in contracts/ directory"
echo "   2. Run tests with: npm test"
echo "   3. Generate coverage report: npm run test:coverage"
echo "   4. View gas report: npm run test:gas"
echo ""
echo "📖 For detailed documentation, see TEST_DOCUMENTATION.md"
echo ""
