# Quick Start Guide

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** and **Docker Compose** (for MongoDB and Redis)

## Installation

### 1. Install Root Dependencies (for demo script)
```bash
# From project root
npm install
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### 3. Install Blockchain Dependencies
```bash
cd blockchain
npm install
cd ..
```

## Configuration

### 1. Backend Environment Variables

Create `.env` file in the `backend` directory:

```env
# Server
PORT=5000
NODE_ENV=development
API_VERSION=v1

# Database (Docker)
MONGODB_URI=mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_db?authSource=admin

# Redis (Docker)
REDIS_URL=redis://:eKYC_Redis_2025@localhost:6379

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Blockchain (Hardhat Local Node)
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 2. Blockchain Environment Variables

Create `.env` file in the `blockchain` directory (if not exists):

```env
# Private key for deployment (Hardhat's first account)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# For testnet deployment (optional)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

## Running the Application

### Complete Startup Process (Recommended)

Open **4 separate terminals** and run these commands in order:

#### Terminal 1: Start Docker Services (MongoDB + Redis)
```bash
# From project root
cd /home/ursus/projects/eKYC/eKYC
docker-compose up

# Or run in background
docker-compose up -d
```

This will start:
- **MongoDB** on port 27017
- **Redis** on port 6379
- **Mongo Express** (GUI) on port 8081
- **Redis Commander** (GUI) on port 8082

Wait until you see:
```
ekyc_mongodb  | [initandlisten] waiting for connections on port 27017
ekyc_redis    | Ready to accept connections
```

#### Terminal 2: Start Hardhat Blockchain Node
```bash
cd blockchain
npm run node
```

This starts a local Hardhat network on port 8545. Wait until you see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

#### Terminal 3: Deploy Smart Contracts
```bash
cd blockchain
npm run deploy:local
```

This deploys the KYC smart contract to the local network. You'll see:
```
Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deploying CredentialRegistry...
CredentialRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Important:** Copy the deployed contract address and update it in your `backend/.env` file:
```env
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

#### Terminal 4: Start Backend Server
```bash
cd backend
npm run dev
```

You should see:
```
MongoDB connected successfully
Redis connected successfully
Server running in development mode on port 5000
API Version: v1
Health Check: http://localhost:5000/health
```

### Alternative: Using Separate Commands

If you prefer to run services individually:

#### 1. Start MongoDB and Redis (Docker)
```bash
# From project root
docker-compose up mongodb redis -d
```

#### 2. Start Blockchain Node (Hardhat)
```bash
cd blockchain
npm run node
```

#### 3. Deploy Contracts
```bash
# In a new terminal
cd blockchain
npm run deploy:local
```

#### 4. Start Backend Server
```bash
cd backend
npm run dev
```

## Verification

### Check All Services Are Running

**1. Docker Services:**
```bash
docker-compose ps
```
You should see `mongodb`, `redis`, `mongo-express`, and `redis-commander` running.

**2. MongoDB (Direct Connection):**
```bash
curl http://localhost:8081
# Or visit http://localhost:8081 in browser (user: admin, pass: admin123)
```

**3. Redis Commander:**
```bash
# Visit http://localhost:8082 in browser
```

**4. Hardhat Node:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**5. Backend Health:**
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-22T...",
  "uptime": 123.456
}
```

## Testing the Integration

### Option 1: Run Automated Tests
```bash
cd backend

# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run with coverage report
npm test -- --coverage

# Watch mode for development
npm run test:watch
```

**Note:** Tests use MongoDB Memory Server, so they don't require Docker services to be running.

### Option 2: Run Demo Flow Script
```bash
# Make sure all services are running first!
cd /home/ursus/projects/eKYC/eKYC
node scripts/demo-flow.js
```

Expected output:
```
╔════════════════════════════════════════════════════════════╗
║          eKYC Blockchain System - Demo Flow               ║
╚════════════════════════════════════════════════════════════╝

ℹ API Base URL: http://localhost:5000
ℹ API Version: v1

==========================================================
Step 1: Register Customer
==========================================================
✓ Customer registered successfully
Customer: {
  "id": "...",
  "email": "customer_...@example.com",
  "name": "John Doe",
  "role": "customer"
}

...

==========================================================
Demo Summary
==========================================================
Successful Steps: 9/9
✓ All steps completed successfully!
```

### Option 3: Manual Testing with cURL

**Test Health Endpoint:**
```bash
curl http://localhost:5000/health
```

**Register a Customer:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+1234567890"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@12345"
  }'
```

Save the `accessToken` from the response and use it in subsequent requests.

## API Endpoints Overview

### Authentication (`/api/v1/auth`)
- `POST /register/customer` - Register customer
- `POST /register/bank-officer` - Register bank officer
- `POST /login` - Login
- `POST /refresh` - Refresh token
- `GET /me` - Get current user
- `POST /logout` - Logout

### KYC (`/api/v1/kyc`)
- `POST /submit` - Submit KYC request
- `GET /status/:requestId` - Get KYC status
- `GET /history` - Get KYC history
- `GET /credentials` - Get blockchain credentials

### Bank (`/api/v1/bank`)
- `GET /kyc-requests` - Get KYC requests
- `GET /kyc-request/:id` - Get KYC details
- `POST /verify/:requestId` - Verify KYC
- `POST /issue-credential` - Issue blockchain credential

## Troubleshooting

### Docker Services Not Starting
```
Error: Cannot start service mongodb: driver failed
```
**Solution:** Make sure Docker is running and ports are available:
```bash
# Check Docker status
docker --version
docker-compose --version

# Check if ports are in use
lsof -i :27017  # MongoDB
lsof -i :6379   # Redis
lsof -i :8081   # Mongo Express
lsof -i :8082   # Redis Commander

# Stop and remove containers
docker-compose down

# Restart
docker-compose up -d
```

### MongoDB Connection Error
```
Error: MongoDB connection error: Authentication failed
```
**Solution:** Make sure you're using the correct MongoDB URI with credentials:
```env
MONGODB_URI=mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_db?authSource=admin
```

### Redis Connection Error
```
Error: Redis connection error: NOAUTH Authentication required
```
**Solution:** Make sure you're using the correct Redis URL with password:
```env
REDIS_URL=redis://:eKYC_Redis_2025@localhost:6379
```

### Hardhat Node Connection Error
```
Error: Could not connect to blockchain
```
**Solution:** Make sure Hardhat node is running:
```bash
cd blockchain
npm run node
```

If you see "address already in use", kill the process on port 8545:
```bash
lsof -i :8545
kill -9 <PID>
```

### Contract Not Deployed Error
```
Error: Contract not deployed at address
```
**Solution:** Deploy the contracts:
```bash
cd blockchain
npm run deploy:local
```

Update the `CONTRACT_ADDRESS` in `backend/.env` with the deployed address.

### Backend Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** Change the port in `.env` or kill the process:
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Tests Failing
**Solution:** Tests use MongoDB Memory Server, so stop the backend server before running tests:
```bash
# Stop the dev server (Ctrl+C)
cd backend
npm test
```

## Stopping Services

### Stop Backend Server
```bash
# Press Ctrl+C in the terminal running the backend
```

### Stop Hardhat Node
```bash
# Press Ctrl+C in the terminal running Hardhat
```

### Stop Docker Services
```bash
# From project root
docker-compose down

# To also remove volumes (clean database)
docker-compose down -v
```

## Development Workflow

### Full Development Setup

```bash
# Terminal 1: Docker services
docker-compose up

# Terminal 2: Hardhat node
cd blockchain && npm run node

# Terminal 3: Deploy contracts (run once, or when contracts change)
cd blockchain && npm run deploy:local

# Terminal 4: Backend server
cd backend && npm run dev

# Terminal 5: Testing/Development
cd backend
npm test                    # Run tests
node ../scripts/demo-flow.js  # Run demo
```

### Making Changes

1. **Edit Code:** Changes auto-reload (nodemon watches backend files)

2. **Test Changes:**
   ```bash
   npm test                    # Run tests
   node ../scripts/demo-flow.js  # Test complete flow
   ```

3. **Check Logs:**
   - Backend: Morgan logger shows all HTTP requests
   - Docker: `docker-compose logs -f mongodb redis`
   - Hardhat: Check the Hardhat node terminal

### Resetting the Environment

**Reset Database:**
```bash
docker-compose down -v
docker-compose up -d mongodb redis
```

**Reset Blockchain:**
```bash
# Stop Hardhat node (Ctrl+C)
# Restart it
cd blockchain
npm run node
# Redeploy contracts
npm run deploy:local
```

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ekyc?retryWrites=true&w=majority
REDIS_URL=redis://user:pass@your-redis-host:6379
JWT_SECRET=<strong-random-secret-256-bits>
JWT_REFRESH_SECRET=<strong-random-secret-256-bits>
CORS_ORIGIN=https://yourdomain.com
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=<deployed-contract-address>
```

### Deploy to Testnet (Sepolia)
```bash
cd blockchain

# Set environment variables
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
export PRIVATE_KEY=your_private_key
export ETHERSCAN_API_KEY=your_etherscan_api_key

# Deploy
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia <CONTRACT_ADDRESS>
```

### Docker Production Build
```bash
# Build and run in production mode
docker-compose -f docker-compose.prod.yml up -d
```

## Useful Commands

### Docker
```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f mongodb

# Restart a service
docker-compose restart mongodb

# Check service status
docker-compose ps

# Remove all data and start fresh
docker-compose down -v && docker-compose up -d
```

### Blockchain
```bash
# Compile contracts
cd blockchain && npm run compile

# Run blockchain tests
npm run test

# Run with gas reporting
npm run test:gas

# Clean and recompile
npm run clean && npm run compile
```

### Backend
```bash
# Run specific test file
npm test -- src/tests/api/integration.test.js

# Run tests matching pattern
npm test -- --testNamePattern="Authentication"

# Run with verbose output
npm test -- --verbose
```

## GUI Tools

### Mongo Express (MongoDB GUI)
- URL: http://localhost:8081
- Username: `admin`
- Password: `admin123`

### Redis Commander (Redis GUI)
- URL: http://localhost:8082

## Documentation

- **API Documentation:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Integration Summary:** [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)
- **Blockchain Service:** [src/services/blockchain/README.md](src/services/blockchain/README.md)
- **Blockchain Setup:** [BLOCKCHAIN_SETUP.md](BLOCKCHAIN_SETUP.md)

## Support

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

For integration details, see [INTEGRATION_SUMMARY.md](INTEGRATION_SUMMARY.md)

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ eKYC System - Quick Reference                               │
├─────────────────────────────────────────────────────────────┤
│ 1. Start Docker:        docker-compose up -d               │
│ 2. Start Hardhat:       cd blockchain && npm run node      │
│ 3. Deploy Contracts:    cd blockchain && npm run deploy:local │
│ 4. Start Backend:       cd backend && npm run dev          │
│ 5. Run Demo:            node scripts/demo-flow.js          │
│ 6. Run Tests:           cd backend && npm test             │
├─────────────────────────────────────────────────────────────┤
│ Services:                                                   │
│ - Backend:              http://localhost:5000              │
│ - MongoDB:              mongodb://localhost:27017          │
│ - Redis:                redis://localhost:6379             │
│ - Hardhat:              http://localhost:8545              │
│ - Mongo Express:        http://localhost:8081              │
│ - Redis Commander:      http://localhost:8082              │
└─────────────────────────────────────────────────────────────┘
```
