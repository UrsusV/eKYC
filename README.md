# eKYC Blockchain System

A complete Know Your Customer (KYC) verification system with blockchain-based credential issuance, built with Node.js, Express, MongoDB, Redis, and Ethereum smart contracts.

## Features

- **Customer-Facing APIs:** Registration, KYC submission, credential retrieval
- **Bank Officer APIs:** KYC verification, blockchain credential issuance
- **Blockchain Integration:** Immutable credential storage on Ethereum
- **Security:** JWT authentication, rate limiting, data sanitization, RBAC
- **Testing:** Comprehensive integration tests with Jest
- **Demo Flow:** Complete workflow demonstration script
- **GUI Tools:** MongoDB Express and Redis Commander for easy management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (TBD)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Routes  │  │  KYC Routes  │  │ Bank Routes  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Middleware (Auth, Error, etc.)           │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────┬────────────────────────────┬────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────────┐
│   MongoDB + Redis   │      │  Blockchain (Hardhat)   │
│   (Docker)          │      │  Smart Contracts        │
└─────────────────────┘      └─────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose

### Option 1: Using the Startup Script (Recommended)

```bash
# Clone the repository
cd /home/ursus/projects/eKYC/eKYC

# Run the startup script
./start-all.sh

# Then follow the instructions to:
# 1. Start Hardhat node
# 2. Deploy contracts
# 3. Start backend server
```

### Option 2: Manual Setup

**1. Start Docker services:**
```bash
docker-compose up -d
```

**2. Install dependencies:**
```bash
# Root (for demo script)
npm install

# Backend
cd backend && npm install && cd ..

# Blockchain
cd blockchain && npm install && cd ..
```

**3. Configure environment variables:**
```bash
# Create backend/.env
cp backend/.env.example backend/.env

# Edit backend/.env with your settings
```

**4. Start Hardhat node:**
```bash
cd blockchain
npm run node
```

**5. Deploy smart contracts (new terminal):**
```bash
cd blockchain
npm run deploy:local
# Copy the contract address to backend/.env
```

**6. Start backend server (new terminal):**
```bash
cd backend
npm run dev
```

**7. Test the system:**
```bash
# Run demo flow
node scripts/demo-flow.js

# Or run tests
cd backend && npm test
```

## Project Structure

```
eKYC/
├── backend/                    # Backend Express.js application
│   ├── src/
│   │   ├── routes/            # API route definitions
│   │   │   ├── auth.routes.js
│   │   │   ├── kyc.routes.js
│   │   │   └── bank.routes.js
│   │   ├── controllers/       # Request handlers
│   │   ├── models/            # Mongoose schemas
│   │   ├── middleware/        # Custom middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   ├── services/          # Business logic
│   │   │   ├── blockchain/   # Blockchain integration
│   │   │   └── kycService.js
│   │   ├── validators/        # Request validation
│   │   ├── tests/            # Test files
│   │   │   └── api/
│   │   │       └── integration.test.js
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Server entry point
│   ├── package.json
│   ├── API_DOCUMENTATION.md   # Complete API reference
│   ├── INTEGRATION_SUMMARY.md # Integration overview
│   └── QUICK_START.md        # Detailed setup guide
│
├── blockchain/                # Smart contracts & deployment
│   ├── contracts/            # Solidity smart contracts
│   ├── scripts/              # Deployment scripts
│   ├── test/                 # Contract tests
│   ├── hardhat.config.js
│   └── package.json
│
├── scripts/                   # Utility scripts
│   └── demo-flow.js          # Complete workflow demo
│
├── docker-compose.yml         # Docker services config
├── start-all.sh              # Startup script
└── README.md                 # This file
```

## API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register/customer` | Public | Register new customer |
| POST | `/register/bank-officer` | Public | Register new bank officer |
| POST | `/login` | Public | Authenticate user |
| POST | `/refresh` | Public | Refresh access token |
| GET | `/me` | Private | Get current user |
| POST | `/logout` | Private | Logout user |

### KYC (`/api/v1/kyc`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/submit` | Customer | Submit KYC request |
| GET | `/status/:requestId` | Customer | Get KYC status |
| GET | `/history` | Customer | Get KYC history |
| GET | `/credentials` | Customer | Get blockchain credentials |

### Bank (`/api/v1/bank`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/kyc-requests` | Bank Officer | Get KYC requests |
| GET | `/kyc-request/:id` | Bank Officer | Get KYC details |
| POST | `/verify/:requestId` | Bank Officer | Approve/reject KYC |
| POST | `/issue-credential` | Bank Officer | Issue blockchain credential |

For detailed API documentation, see [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)

## Testing

### Run Integration Tests
```bash
cd backend

# All tests
npm test

# Integration tests only
npm run test:integration

# With coverage
npm test -- --coverage
```

### Run Demo Flow
```bash
# Ensure all services are running
node scripts/demo-flow.js
```

The demo flow will:
1. Register a customer
2. Submit KYC request
3. Register bank officer
4. Bank officer approves KYC
5. Issue blockchain credential
6. Customer retrieves credential
7. Display summary

## Development

### Start Development Environment

```bash
# Terminal 1: Docker services
docker-compose up

# Terminal 2: Hardhat blockchain
cd blockchain && npm run node

# Terminal 3: Deploy contracts (once)
cd blockchain && npm run deploy:local

# Terminal 4: Backend server
cd backend && npm run dev

# Terminal 5: Development/Testing
cd backend && npm test
```

### Making Changes

- **Backend:** Automatically reloads (nodemon)
- **Smart Contracts:** Recompile and redeploy
- **Database:** Use Mongo Express at http://localhost:8081
- **Redis:** Use Redis Commander at http://localhost:8082

## Services & Ports

| Service | Port | URL/Connection |
|---------|------|----------------|
| Backend API | 5000 | http://localhost:5000 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Redis | 6379 | redis://localhost:6379 |
| Hardhat Node | 8545 | http://localhost:8545 |
| Mongo Express | 8081 | http://localhost:8081 |
| Redis Commander | 8082 | http://localhost:8082 |

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
API_VERSION=v1

MONGODB_URI=mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_db?authSource=admin
REDIS_URL=redis://:eKYC_Redis_2025@localhost:6379

JWT_SECRET=your-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=7d

CORS_ORIGIN=http://localhost:3000

BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Blockchain (.env)
```env
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_KEY
```

## Security Features

- **Authentication:** JWT-based with access and refresh tokens
- **Authorization:** Role-based access control (RBAC)
- **Rate Limiting:** Configurable per endpoint
- **Data Sanitization:** NoSQL injection prevention, XSS protection
- **Security Headers:** Helmet.js configuration
- **Password Hashing:** bcrypt
- **CORS:** Configurable origins

## Troubleshooting

### Common Issues

**MongoDB connection error:**
```bash
# Check if Docker is running
docker-compose ps

# Restart MongoDB
docker-compose restart mongodb
```

**Hardhat node not running:**
```bash
cd blockchain
npm run node
```

**Contract not deployed:**
```bash
cd blockchain
npm run deploy:local
# Update CONTRACT_ADDRESS in backend/.env
```

**Port already in use:**
```bash
# Find and kill process
lsof -i :5000
kill -9 <PID>
```

For more troubleshooting, see [backend/QUICK_START.md](backend/QUICK_START.md)

## Documentation

- **[API Documentation](backend/API_DOCUMENTATION.md)** - Complete API reference with examples
- **[Quick Start Guide](backend/QUICK_START.md)** - Detailed setup instructions
- **[Integration Summary](backend/INTEGRATION_SUMMARY.md)** - Overview of integration work
- **[Blockchain Service](backend/src/services/blockchain/README.md)** - Blockchain integration details

## Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose)
- **Cache:** Redis (ioredis)
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator, Joi
- **Security:** Helmet, CORS, rate-limit
- **Testing:** Jest, Supertest
- **Logging:** Morgan, Winston

### Blockchain
- **Framework:** Hardhat
- **Language:** Solidity 0.8.24
- **Library:** ethers.js v6
- **Network:** Local/Sepolia testnet

### Infrastructure
- **Containerization:** Docker, Docker Compose
- **Database GUI:** Mongo Express
- **Cache GUI:** Redis Commander

## Workflow

### Customer Flow
1. Customer registers account
2. Customer submits KYC with documents
3. Customer checks KYC status
4. Customer retrieves blockchain credential

### Bank Officer Flow
1. Bank officer registers/logs in
2. Views pending KYC requests
3. Reviews KYC details and documents
4. Approves or rejects KYC
5. Issues blockchain credential for approved KYC

### Blockchain Flow
1. Smart contract deployed to network
2. Bank officer registered as issuer
3. Credential issued on-chain
4. Transaction hash and block number stored
5. Customer can verify credential on blockchain

## Roadmap

- [ ] Frontend application (React/Vue)
- [ ] Email notifications
- [ ] Document verification AI
- [ ] Multi-signature approval
- [ ] Credential revocation
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Mobile app

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
- Check the documentation in `/backend` directory
- Review troubleshooting section
- Open an issue on GitHub

---

**Last Updated:** November 22, 2024

**Status:** ✅ All APIs integrated and tested
