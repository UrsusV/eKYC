# eKYC Blockchain System

> A blockchain-based Know Your Customer (KYC) verification and digital credential issuance platform built with modern web technologies and Ethereum smart contracts.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Smart Contracts](#smart-contracts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Features](#security-features)
- [License](#license)

## 🌟 Overview

The eKYC Blockchain System is a comprehensive digital identity verification platform that combines traditional KYC processes with blockchain technology. The system enables:

- **Customers** to submit KYC documents and receive verifiable blockchain-based credentials
- **Bank Officers** to review and verify KYC submissions and issue immutable credentials on the blockchain
- **Verifiers** to validate credentials without accessing sensitive personal information
- **Consent Management** for secure credential sharing between parties

The platform ensures data immutability, transparency, and user privacy through its blockchain-based architecture while maintaining a user-friendly interface for all stakeholders.

## ✨ Key Features

### Customer Features

- User registration and authentication with JWT
- KYC document submission (NID, passport, driving license, etc.)
- Real-time KYC status tracking
- Blockchain credential retrieval and management
- Consent-based credential sharing
- KYC submission history

### Bank Officer Features

- KYC request queue management
- Document review and verification workflow
- Blockchain credential issuance
- Request filtering and search
- Verification history tracking
- Dashboard with statistics

### System Features

- **Blockchain Integration**: Immutable credential storage on Ethereum
- **Security**: JWT authentication, rate limiting, input sanitization, RBAC
- **Consent Management**: Granular control over credential sharing
- **Caching**: Redis-based caching for improved performance
- **File Upload**: Secure document handling with validation
- **Database**: MongoDB for persistent storage
- **API Documentation**: Swagger/OpenAPI integration
- **Testing**: Comprehensive unit, integration, and E2E tests
- **Docker Support**: Containerized development environment

## 🛠 Technology Stack

### Frontend

- **React 18.3** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend

- **Node.js 18+** - JavaScript runtime
- **Express.js 4** - Web framework
- **MongoDB 7.0** - NoSQL database
- **Mongoose 8** - ODM for MongoDB
- **Redis 7** - Caching and session storage
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Winston** - Logging
- **Joi** - Request validation

### Blockchain

- **Hardhat** - Ethereum development environment
- **Solidity ^0.8.0** - Smart contract language
- **Ethers.js 6** - Ethereum library
- **OpenZeppelin Contracts** - Secure smart contract library
- **Chai** - Testing framework

### DevOps & Tools

- **Docker & Docker Compose** - Containerization
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **MongoDB Express** - Database GUI
- **Redis Commander** - Redis GUI

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │Dashboard │  │   KYC    │  │  Consent │  │ Credentials  │   │
│  │  Pages   │  │  Pages   │  │  Pages   │  │    Pages     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        React Router + TanStack Query + Axios            │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend API (Express.js)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  API Routes Layer                         │  │
│  │  /auth  /kyc  /bank  /consent  /credentials              │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Middleware Layer                             │  │
│  │  Authentication │ Authorization │ Validation │ Error      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             Controllers & Services                        │  │
│  │  Auth │ KYC │ Bank │ Consent │ Blockchain │ Credential   │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────┬─────────────────────┬──────────────────┬───────────────┘
        │                     │                  │
        ▼                     ▼                  ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   MongoDB     │   │      Redis       │   │  Ethereum Node   │
│   (Docker)    │   │   (Docker)       │   │   (Hardhat)      │
│               │   │                  │   │                  │
│ • Users       │   │ • Sessions       │   │ • CredentialReg  │
│ • KYC Reqs    │   │ • Cache          │   │   Smart Contract │
│ • Credentials │   │ • Rate Limits    │   │ • Immutable      │
│ • Consents    │   │ • Queues         │   │   Credentials    │
└───────────────┘   └──────────────────┘   └──────────────────┘
```

### Data Flow

1. **User Authentication**: JWT-based authentication with refresh tokens
2. **KYC Submission**: Customer submits documents → Stored in MongoDB → Files uploaded to server
3. **KYC Verification**: Bank officer reviews → Approves/Rejects → Updates status
4. **Credential Issuance**: Officer issues credential → Smart contract stores hash → MongoDB stores metadata
5. **Consent Management**: Credential holder grants consent → Verifier can access credential
6. **Credential Verification**: Anyone can verify credential authenticity via blockchain

## 📁 Project Structure

```
eKYC/
├── backend/                          # Backend Express.js application
│   ├── src/
│   │   ├── routes/                   # API route definitions
│   │   │   ├── auth.routes.js        # Authentication endpoints
│   │   │   ├── kyc.routes.js         # KYC submission endpoints
│   │   │   ├── bank.routes.js        # Bank officer endpoints
│   │   │   ├── consent.routes.js     # Consent management endpoints
│   │   │   └── credential.routes.js  # Credential endpoints
│   │   ├── controllers/              # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── kycController.js
│   │   │   ├── bankController.js
│   │   │   ├── consentController.js
│   │   │   └── credentialController.js
│   │   ├── models/                   # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── KYCRequest.js
│   │   │   ├── Credential.js
│   │   │   └── Consent.js
│   │   ├── services/                 # Business logic
│   │   │   ├── blockchain/
│   │   │   │   ├── blockchainService.js
│   │   │   │   └── credentialService.js
│   │   │   └── kycService.js
│   │   ├── middleware/               # Custom middleware
│   │   │   ├── auth.js               # JWT verification
│   │   │   ├── authorize.js          # Role-based access
│   │   │   ├── errorHandler.js       # Error handling
│   │   │   └── validators.js         # Input validation
│   │   ├── validators/               # Request validation schemas
│   │   ├── tests/                    # Test files
│   │   ├── app.js                    # Express app configuration
│   │   └── server.js                 # Server entry point
│   ├── uploads/                      # Uploaded documents
│   ├── package.json
│   ├── jest.config.js
│   └── eslint.config.js
│
├── blockchain/                       # Smart contracts & deployment
│   ├── contracts/
│   │   └── CredentialRegistry.sol    # Main smart contract
│   ├── scripts/
│   │   ├── deploy.js                 # Deployment script
│   │   └── setup-issuers.js          # Issuer authorization
│   ├── test/
│   │   └── CredentialRegistry.test.js
│   ├── hardhat.config.js
│   └── package.json
│
├── frontend/                         # React frontend application
│   ├── src/
│   │   ├── components/               # Reusable components
│   │   │   ├── layout/
│   │   │   ├── auth/
│   │   │   ├── kyc/
│   │   │   └── common/
│   │   ├── pages/                    # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SubmitKycPage.tsx
│   │   │   ├── KycQueuePage.tsx
│   │   │   ├── ReviewKycPage.tsx
│   │   │   ├── CredentialsPage.tsx
│   │   │   ├── ConsentsPage.tsx
│   │   │   └── ...
│   │   ├── services/                 # API services
│   │   │   ├── api.ts                # Axios instance
│   │   │   ├── authService.ts
│   │   │   ├── kycService.ts
│   │   │   └── credentialService.ts
│   │   ├── contexts/                 # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── types/                    # TypeScript types
│   │   ├── utils/                    # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── scripts/                          # Utility scripts
│   ├── demo-flow.js                  # Complete workflow demo
│   └── mongo-init.js                 # MongoDB initialization
│
├── docker-compose.yml                # Docker services configuration
├── start-all.sh                      # Startup script
├── package.json                      # Root package.json
├── LICENSE
└── README.md                         # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** and **Docker Compose**
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/eKYC.git
cd eKYC
```

#### 2. Start Docker Services

Start MongoDB and Redis containers:

```bash
docker-compose up -d
```

This will start:

- **MongoDB** on port 27017
- **Redis** on port 6379
- **MongoDB Express** (GUI) on port 8081
- **Redis Commander** (GUI) on port 8082

#### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install blockchain dependencies
cd blockchain && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

#### 4. Configure Environment Variables

Create `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
MONGODB_URI=mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_db?authSource=admin

# Redis
REDIS_URL=redis://:eKYC_Redis_2025@localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Blockchain
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=<will-be-filled-after-deployment>
PRIVATE_KEY=<hardhat-account-private-key>

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

#### 5. Start Hardhat Blockchain Node

In a new terminal:

```bash
cd blockchain
npm run node
```

Keep this terminal running. You'll see test accounts with private keys and ETH balances.

#### 6. Deploy Smart Contracts

In another terminal:

```bash
cd blockchain
npm run deploy:local
```

Copy the deployed contract address and update `CONTRACT_ADDRESS` in `backend/.env`.

#### 7. Start Backend Server

In another terminal:

```bash
cd backend
npm run dev
```

Backend will start on http://localhost:5000

#### 8. Start Frontend Development Server

In another terminal:

```bash
cd frontend
npm run dev
```

Frontend will start on http://localhost:5173

### Quick Start Script

Alternatively, use the automated startup script:

```bash
./start-all.sh
```

Follow the on-screen instructions to start services in the correct order.

### Verify Installation

1. **Check Backend Health**: http://localhost:5000/health
2. **Check MongoDB Express**: http://localhost:8081 (admin/admin123)
3. **Check Redis Commander**: http://localhost:8082
4. **Check Frontend**: http://localhost:5173

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register Customer

```http
POST /auth/register/customer
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

#### Register Bank Officer

```http
POST /auth/register/bank-officer
Content-Type: application/json

{
  "email": "officer@bank.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "employeeId": "EMP001",
  "bankName": "Global Bank"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <accessToken>
```

### KYC Endpoints

#### Submit KYC Request

```http
POST /kyc/submit
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data

{
  "documentType": "nid",
  "documentNumber": "1234567890",
  "dateOfBirth": "1990-01-01",
  "address": "123 Main St, City",
  "documents": [<file1>, <file2>]
}
```

#### Get KYC Status

```http
GET /kyc/status/:requestId
Authorization: Bearer <accessToken>
```

#### Get KYC History

```http
GET /kyc/history
Authorization: Bearer <accessToken>
```

#### Get My Credentials

```http
GET /kyc/credentials
Authorization: Bearer <accessToken>
```

### Bank Officer Endpoints

#### Get KYC Queue

```http
GET /bank/kyc-requests?status=pending&page=1&limit=10
Authorization: Bearer <accessToken>
```

#### Get KYC Request Details

```http
GET /bank/kyc-request/:id
Authorization: Bearer <accessToken>
```

#### Verify KYC Request

```http
POST /bank/verify/:requestId
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "action": "approve",
  "comments": "All documents verified successfully"
}
```

#### Issue Blockchain Credential

```http
POST /bank/issue-credential
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "requestId": "request_id_here",
  "credentialType": 2,
  "credentialData": {
    "fullName": "John Doe",
    "documentNumber": "1234567890",
    "verificationLevel": "full"
  }
}
```

### Consent Management Endpoints

#### Create Consent Request

```http
POST /consent/create
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "credentialId": "cred_id_here",
  "verifierId": "verifier_user_id",
  "purpose": "Loan application verification",
  "expiresIn": 86400
}
```

#### Grant Consent

```http
POST /consent/:consentId/grant
Authorization: Bearer <accessToken>
```

#### Deny Consent

```http
POST /consent/:consentId/deny
Authorization: Bearer <accessToken>
```

#### Revoke Consent

```http
POST /consent/:consentId/revoke
Authorization: Bearer <accessToken>
```

#### Get My Consents

```http
GET /consent/my-consents
Authorization: Bearer <accessToken>
```

### Credential Endpoints

#### Get Credential Details

```http
GET /credentials/:credentialId
Authorization: Bearer <accessToken>
```

#### Revoke Credential

```http
POST /credentials/:credentialId/revoke
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "reason": "Document expired"
}
```

#### Check Revocation Status

```http
GET /credentials/:credentialId/revocation-status
```

### Response Format

All API responses follow this format:

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🔗 Smart Contracts

### CredentialRegistry Contract

The main smart contract for storing and managing credentials on the blockchain.

#### Contract Structure

```solidity
struct Credential {
    bytes32 credentialHash;      // SHA256 hash of credential data
    address issuer;              // Bank officer who issued
    address holder;              // Credential owner
    uint256 issuedAt;           // Timestamp
    bool isRevoked;             // Revocation status
    uint256 credentialType;     // 1 = Student ID, 2 = KYC
}
```

#### Key Functions

**Issue Credential** (Authorized Issuers Only)

```solidity
function issueCredential(
    bytes32 _credentialId,
    bytes32 _credentialHash,
    address _holder,
    uint256 _credentialType
) external onlyAuthorizedIssuer
```

**Revoke Credential** (Issuer Only)

```solidity
function revokeCredential(bytes32 _credentialId) external
```

**Grant Consent** (Holder Only)

```solidity
function grantConsent(
    address _verifier,
    bytes32 _credentialId
) external
```

**Verify Credential** (Public)

```solidity
function verifyCredential(bytes32 _credentialId)
    external view returns (bool)
```

**Get Credential** (Public)

```solidity
function getCredential(bytes32 _credentialId)
    external view returns (Credential memory)
```

#### Events

```solidity
event CredentialIssued(
    bytes32 indexed credentialId,
    address indexed issuer,
    address indexed holder,
    uint256 credentialType
);

event CredentialRevoked(bytes32 indexed credentialId);

event ConsentGranted(
    address indexed holder,
    address indexed verifier,
    bytes32 indexed credentialId
);
```

#### Deployment

The contract is deployed using Hardhat:

```bash
cd blockchain
npm run deploy:local
```

Contract artifacts are stored in `blockchain/deployments/`.

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:blockchain

# Run in watch mode
npm run test:watch
```

### Blockchain Tests

```bash
cd blockchain

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with gas reporting
npm run test:gas
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Type checking
npm run type-check
```

### E2E Testing

Run the complete demo flow:

```bash
# From root directory
npm run demo

# Or directly
node scripts/demo-flow.js
```

This will:

1. Register a customer and bank officer
2. Submit a KYC request
3. Verify the KYC request
4. Issue a blockchain credential
5. Create and grant consent
6. Verify credential on blockchain

### Test Coverage

The project maintains high test coverage:

- **Backend**: Controllers, Services, Models
- **Blockchain**: Smart contract functions and edge cases
- **Integration**: API endpoints and workflows

## 🚀 Deployment

### Production Environment Variables

Create `backend/.env.production`:

```env
NODE_ENV=production
PORT=5000

# Use production MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ekyc

# Use production Redis
REDIS_URL=redis://production-redis:6379

# Strong secrets
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>

# Production blockchain (Ethereum mainnet or testnet)
BLOCKCHAIN_NETWORK=mainnet
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=<deployed-contract-address>
PRIVATE_KEY=<secure-private-key>
```

### Backend Deployment

```bash
cd backend
npm run build
npm start
```

### Frontend Deployment

```bash
cd frontend
npm run build:production
```

The `dist` folder contains production-ready static files. Deploy to:

- **Netlify**
- **Vercel**
- **AWS S3 + CloudFront**
- **Nginx**

### Blockchain Deployment

Deploy to Ethereum testnet (Sepolia):

```bash
cd blockchain
npm run deploy:sepolia
```

Deploy to mainnet (use with caution):

```bash
npm run deploy:mainnet
```

### Docker Production Deployment

Build and run production containers:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Features

### Authentication & Authorization

- **JWT Tokens**: Secure access and refresh tokens
- **Password Hashing**: Bcrypt with salt rounds
- **Role-Based Access Control (RBAC)**: Customer, Bank Officer, Admin roles
- **Session Management**: Redis-based session storage

### API Security

- **Rate Limiting**: Prevent brute force attacks
- **CORS**: Configured cross-origin resource sharing
- **Helmet**: Security headers
- **Input Sanitization**: MongoDB injection prevention
- **XSS Protection**: Cross-site scripting prevention
- **HPP**: HTTP Parameter Pollution protection

### Data Security

- **Encryption**: Sensitive data encryption at rest
- **HTTPS**: TLS/SSL in production
- **File Upload Validation**: Type and size restrictions
- **SQL/NoSQL Injection Prevention**: Input validation

### Blockchain Security

- **Immutability**: Credential data cannot be altered
- **Access Control**: Only authorized issuers can issue credentials
- **Consent Management**: Holders control credential access
- **Audit Trail**: All transactions are recorded on blockchain

### Best Practices

- Environment variable protection
- Secure credential storage
- Regular security audits
- Dependency vulnerability scanning
- Error handling without information leakage

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🗺 Roadmap

- [ ] Mobile application (React Native)
- [ ] Multi-chain support (Polygon, BSC)
- [ ] Decentralized identity (DID) integration
- [ ] Advanced analytics dashboard
- [ ] AI-powered document verification
- [ ] Multi-language support
- [ ] Biometric authentication
- [ ] Zero-knowledge proofs for privacy

---

**Built with ❤️ for CSE499B Capstone Project**
