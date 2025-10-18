#!/bin/bash

# eKYC Blockchain System - Complete Project Setup Script (Updated)
# For Ubuntu-based systems
# Run this script from the eKYC root directory

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running from eKYC directory
if [ ! -f "LICENSE" ]; then
    print_error "Please run this script from the eKYC root directory"
    exit 1
fi

print_status "Starting eKYC Blockchain System Setup (Updated Version)..."

# Check for required tools
print_status "Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first"
    echo "Run: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ required. Current version: $(node -v)"
        exit 1
    fi
    print_status "Node.js $(node -v) detected"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
else
    print_status "npm $(npm -v) detected"
fi

# Check for system dependencies for sharp
print_status "Installing system dependencies for image processing..."
sudo apt-get update -qq
sudo apt-get install -y build-essential python3 libvips-dev libvips42 --no-install-recommends

# Check Docker
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Install it for MongoDB and Redis containers"
    echo "Visit: https://docs.docker.com/engine/install/ubuntu/"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose is not installed"
    echo "Run: sudo apt-get update && sudo apt-get install docker-compose"
fi

print_status "Prerequisites check completed"

# Create main project structure
print_status "Creating project structure..."

# Create directories
mkdir -p blockchain/{contracts,scripts,test,artifacts,cache}
mkdir -p backend/{src/{config,controllers,middleware,models,routes,services,utils,validators},uploads,logs}
mkdir -p frontend/{customer-portal,bank-portal,admin-portal}
mkdir -p .github/workflows
mkdir -p docs
mkdir -p scripts

print_status "Project structure created"

# Create .gitignore
print_status "Creating .gitignore file..."

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Environment variables
.env
.env.local
.env.development
.env.test
.env.production
*.env

# Blockchain
blockchain/artifacts/
blockchain/cache/
blockchain/coverage/
blockchain/coverage.json
blockchain/typechain/
blockchain/typechain-types/

# Hardhat files
*.solidity
*.abi
*.bin

# Backend
backend/uploads/*
!backend/uploads/.gitkeep
backend/logs/*
!backend/logs/.gitkeep
backend/dist/
backend/build/

# Frontend
frontend/*/build/
frontend/*/dist/
frontend/*/.next/
frontend/*/out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/
*.lcov
.nyc_output/

# Docker
docker-compose.override.yml

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS files
Thumbs.db
*.bak

# Temporary files
tmp/
temp/
.tmp/

# Build files
build/
dist/

# Documentation
docs/_site/
docs/.sass-cache/

# MongoDB dump files
dump/

# Redis dump files
*.rdb
*.aof
EOF

# Create .gitkeep files for empty directories
touch backend/uploads/.gitkeep
touch backend/logs/.gitkeep

print_status ".gitignore created"

# Create docker-compose.yml
print_status "Creating docker-compose.yml..."

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: ekyc_mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: eKYC_Admin_2025
      MONGO_INITDB_DATABASE: ekyc_db
    volumes:
      - mongodb_data:/data/db
      - ./scripts/mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - ekyc_network

  redis:
    image: redis:7-alpine
    container_name: ekyc_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass eKYC_Redis_2025
    volumes:
      - redis_data:/data
    networks:
      - ekyc_network

  # Optional: MongoDB Express for database GUI
  mongo-express:
    image: mongo-express:latest
    container_name: ekyc_mongo_express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: eKYC_Admin_2025
      ME_CONFIG_MONGODB_URL: mongodb://admin:eKYC_Admin_2025@mongodb:27017/
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: admin123
    depends_on:
      - mongodb
    networks:
      - ekyc_network

  # Optional: Redis Commander for Redis GUI
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: ekyc_redis_commander
    restart: unless-stopped
    ports:
      - "8082:8081"
    environment:
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: eKYC_Redis_2025
    depends_on:
      - redis
    networks:
      - ekyc_network

volumes:
  mongodb_data:
    driver: local
  redis_data:
    driver: local

networks:
  ekyc_network:
    driver: bridge
EOF

print_status "docker-compose.yml created"

# Create MongoDB initialization script
print_status "Creating MongoDB initialization script..."

cat > scripts/mongo-init.js << 'EOF'
// MongoDB initialization script for eKYC database

db = db.getSiblingDB('ekyc_db');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'role', 'createdAt'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        role: {
          enum: ['customer', 'bank_officer', 'admin']
        }
      }
    }
  }
});

db.createCollection('kyc_requests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'status', 'createdAt'],
      properties: {
        status: {
          enum: ['pending', 'under_review', 'approved', 'rejected', 'expired']
        }
      }
    }
  }
});

db.createCollection('credentials');
db.createCollection('consent_logs');
db.createCollection('audit_logs');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ walletAddress: 1 }, { sparse: true });
db.users.createIndex({ role: 1 });

db.kyc_requests.createIndex({ userId: 1 });
db.kyc_requests.createIndex({ status: 1 });
db.kyc_requests.createIndex({ createdAt: -1 });

db.credentials.createIndex({ userId: 1 });
db.credentials.createIndex({ credentialHash: 1 }, { unique: true });
db.credentials.createIndex({ txHash: 1 }, { sparse: true });

db.consent_logs.createIndex({ userId: 1 });
db.consent_logs.createIndex({ requesterId: 1 });
db.consent_logs.createIndex({ createdAt: -1 });

db.audit_logs.createIndex({ userId: 1 });
db.audit_logs.createIndex({ action: 1 });
db.audit_logs.createIndex({ timestamp: -1 });

print('eKYC database initialized successfully');
EOF

print_status "MongoDB initialization script created"

# Create Blockchain package.json with updated packages
print_status "Setting up Blockchain (Hardhat) configuration with latest packages..."

cat > blockchain/package.json << 'EOF'
{
  "name": "ekyc-blockchain",
  "version": "1.0.0",
  "description": "Smart contracts for eKYC blockchain system",
  "scripts": {
    "compile": "npx hardhat compile",
    "test": "npx hardhat test",
    "test:coverage": "npx hardhat coverage",
    "deploy:local": "npx hardhat run scripts/deploy.js --network localhost",
    "deploy:sepolia": "npx hardhat run scripts/deploy.js --network sepolia",
    "node": "npx hardhat node",
    "console": "npx hardhat console",
    "clean": "npx hardhat clean",
    "verify": "npx hardhat verify"
  },
  "keywords": ["eKYC", "blockchain", "ethereum", "smart-contracts"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^5.0.0",
    "@nomicfoundation/hardhat-chai-matchers": "^2.0.8",
    "@nomicfoundation/hardhat-ethers": "^3.0.8",
    "@nomicfoundation/hardhat-network-helpers": "^1.0.12",
    "@nomicfoundation/hardhat-verify": "^2.0.11",
    "@typechain/ethers-v6": "^0.5.1",
    "@typechain/hardhat": "^9.1.0",
    "@types/chai": "^4.3.20",
    "@types/mocha": "^10.0.9",
    "@types/node": "^22.7.7",
    "chai": "^4.5.0",
    "ethers": "^6.13.4",
    "hardhat": "^2.22.13",
    "hardhat-gas-reporter": "^2.2.1",
    "solidity-coverage": "^0.8.13",
    "ts-node": "^10.9.2",
    "typechain": "^8.3.2",
    "typescript": "^5.6.3"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.2",
    "dotenv": "^16.4.5"
  }
}
EOF

# Create Hardhat config
cat > blockchain/hardhat.config.js << 'EOF'
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: 20000000000 // 20 gwei
    },
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 5000
      }
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};
EOF

# Create blockchain .env.example
cat > blockchain/.env.example << 'EOF'
# Ethereum Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gas Reporting (Optional)
REPORT_GAS=false
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Contract Addresses (Will be filled after deployment)
CONTRACT_ADDRESS=
EOF

print_status "Blockchain configuration created"

# Create Backend package.json with updated packages
print_status "Setting up Backend configuration with latest packages..."

cat > backend/package.json << 'EOF'
{
  "name": "ekyc-backend",
  "version": "1.0.0",
  "description": "Backend API for eKYC blockchain system",
  "main": "src/server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:integration": "jest --testMatch='**/*.integration.test.js'",
    "lint": "eslint src/ --ext .js",
    "lint:fix": "eslint src/ --ext .js --fix",
    "seed": "node scripts/seed.js",
    "migrate": "node scripts/migrate.js"
  },
  "keywords": ["eKYC", "blockchain", "api", "express"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.21.1",
    "express-rate-limit": "^7.4.1",
    "express-validator": "^7.2.0",
    "helmet": "^8.0.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "mongoose": "^8.7.2",
    "redis": "^4.7.0",
    "ioredis": "^5.4.1",
    "bullmq": "^5.25.1",
    "ethers": "^6.13.4",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "multer": "^2.0.3",
    "jimp": "^1.6.0",
    "uuid": "^11.0.2",
    "winston": "^3.15.0",
    "winston-daily-rotate-file": "^5.0.0",
    "morgan": "^1.10.0",
    "joi": "^17.13.3",
    "crypto-js": "^4.2.0",
    "axios": "^1.7.7",
    "node-cron": "^3.0.3",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1",
    "express-mongo-sanitize": "^2.2.0",
    "xss": "^1.0.15",
    "hpp": "^0.2.3",
    "node-cache": "^5.1.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.7",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "mongodb-memory-server": "^10.0.1",
    "@types/jest": "^29.5.14",
    "eslint": "^9.13.0",
    "@eslint/js": "^9.13.0",
    "prettier": "^3.3.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
EOF

# Create Backend .env.example
cat > backend/.env.example << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
MONGODB_URI=mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_db?authSource=admin
REDIS_URL=redis://:eKYC_Redis_2025@localhost:6379

# Blockchain Configuration
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=
PRIVATE_KEY=
GAS_LIMIT=3000000

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret_change_this
JWT_REFRESH_EXPIRE=30d

# Encryption Keys
ENCRYPTION_KEY=your_32_character_encryption_key_change_this!!!
ENCRYPTION_IV=your_16_char_iv!

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg,application/pdf

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@ekyc.bd

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs

# External APIs (if needed)
NID_VERIFICATION_API=
NID_API_KEY=

# Session Configuration
SESSION_SECRET=your_session_secret_change_this

# Bangladesh Specific
TIMEZONE=Asia/Dhaka
DEFAULT_LANGUAGE=bn
SUPPORTED_LANGUAGES=bn,en
EOF

# Create Backend app.js with updated middleware
cat > backend/src/app.js << 'EOF'
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Import custom middleware (will be created later)
// const errorHandler = require('./middleware/errorHandler');
// const notFound = require('./middleware/notFound');

// Import routes (will be created later)
// const authRoutes = require('./routes/auth.routes');
// const kycRoutes = require('./routes/kyc.routes');
// const credentialRoutes = require('./routes/credential.routes');
// const consentRoutes = require('./routes/consent.routes');
// const adminRoutes = require('./routes/admin.routes');

// Initialize express app
const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS - Updated approach
app.use((req, res, next) => {
    // Only sanitize string values
    const sanitizeObject = (obj) => {
        if (!obj) return obj;
        if (typeof obj === 'string') return xss(obj);
        if (Array.isArray(obj)) return obj.map(sanitizeObject);
        if (typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };

    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
});

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes (uncomment when routes are created)
const apiVersion = process.env.API_VERSION || 'v1';
// app.use(`/api/${apiVersion}/auth`, authRoutes);
// app.use(`/api/${apiVersion}/kyc`, kycRoutes);
// app.use(`/api/${apiVersion}/credentials`, credentialRoutes);
// app.use(`/api/${apiVersion}/consent`, consentRoutes);
// app.use(`/api/${apiVersion}/admin`, adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API documentation
if (process.env.NODE_ENV === 'development') {
    const swaggerUi = require('swagger-ui-express');
    // const swaggerSpec = require('./config/swagger');
    // app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Temporary root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'eKYC Blockchain API',
        version: process.env.API_VERSION || 'v1',
        status: 'running'
    });
});

// Error handling (uncomment when middleware is created)
// app.use(notFound);
// app.use(errorHandler);

module.exports = app;
EOF

# Create Backend server.js
cat > backend/src/server.js << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');
const Redis = require('ioredis');
const app = require('./app');
// const logger = require('./utils/logger');

// Simple console logger until winston is configured
const logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
};

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Redis connection
const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => {
    logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
    logger.error('Redis connection error:', error);
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            logger.info(`API Version: ${process.env.API_VERSION || 'v1'}`);

            if (process.env.NODE_ENV === 'development') {
                logger.info(`Health Check: http://localhost:${PORT}/health`);
            }
        });

        // Set keepAliveTimeout
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;

    } catch (error) {
        logger.error('Server startup error:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    mongoose.disconnect();
    redis.disconnect();
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    mongoose.disconnect();
    redis.disconnect();
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    await mongoose.disconnect();
    await redis.disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    await mongoose.disconnect();
    await redis.disconnect();
    process.exit(0);
});

// Start the server
startServer();

module.exports = { app, redis };
EOF

# Create ESLint configuration (new format for v9)
print_status "Creating ESLint configuration..."

cat > backend/eslint.config.js << 'EOF'
const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'writable',
                module: 'writable',
                require: 'readonly',
                global: 'readonly',
                URL: 'readonly'
            }
        },
        rules: {
            'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
            'no-unused-vars': ['error', { argsIgnorePattern: 'next|req|res|err' }],
            'indent': ['error', 4],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always']
        },
        ignores: ['node_modules/', 'dist/', 'build/', 'coverage/']
    }
];
EOF

# Create Prettier configuration
cat > backend/.prettierrc << 'EOF'
{
    "semi": true,
    "trailingComma": "none",
    "singleQuote": true,
    "printWidth": 120,
    "tabWidth": 4
}
EOF

# Create Jest configuration
cat > backend/jest.config.js << 'EOF'
module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/server.js'
    ],
    testMatch: [
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
        '/build/'
    ],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
EOF

print_status "Backend configuration created"

# Create deployment script
cat > blockchain/scripts/deploy.js << 'EOF'
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Deploying CredentialRegistry contract...");

    // Get the contract factory
    const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");

    // Deploy the contract
    const credentialRegistry = await CredentialRegistry.deploy();

    // Wait for deployment to finish
    await credentialRegistry.waitForDeployment();

    const address = await credentialRegistry.getAddress();
    const [deployer] = await hre.ethers.getSigners();

    console.log("CredentialRegistry deployed to:", address);
    console.log("Deployed by:", deployer.address);
    console.log("Network:", hre.network.name);
    console.log("\nIMPORTANT: Save this address in your .env file!");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contract: "CredentialRegistry",
        address: address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: (await hre.ethers.provider.getBlockNumber()).toString()
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    fs.writeFileSync(
        path.join(deploymentsDir, `${hre.network.name}-deployment.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\nDeployment info saved to:", `deployments/${hre.network.name}-deployment.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
EOF

mkdir -p blockchain/deployments