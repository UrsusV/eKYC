# eKYC Blockchain System - Complete Architecture Context

## 📋 Executive Summary

The eKYC (Electronic Know Your Customer) Blockchain System is a comprehensive digital identity verification platform that combines traditional web technologies with blockchain-based credential management. The system enables customers to submit KYC requests, allows bank officers to verify and approve these requests, and issues immutable blockchain credentials upon successful verification.

**Project Type**: Full-stack Web Application with Blockchain Integration  
**Architecture Pattern**: Three-tier Architecture (Frontend + Backend + Blockchain)  
**Tech Stack**: MERN Stack + Ethereum Smart Contracts  
**Development Status**: Production-ready with comprehensive testing

---

## 🏗️ System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │   Customer   │  │ Bank Officer │  │    Public    │                 │
│  │  Dashboard   │  │   Dashboard  │  │     Pages    │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│         │                  │                  │                         │
│         └──────────────────┴──────────────────┘                         │
│                            │                                            │
│                   React Router + Context API                            │
│                   API Services (Axios)                                  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTP/REST (Port 3000 → 5000)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    API Layer (Express Routes)                   │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │    │
│  │  │   Auth   │  │   KYC    │  │   Bank   │  │ Consent  │       │    │
│  │  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │       │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │    │
│  └────────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   Middleware Layer                              │    │
│  │  • JWT Authentication  • Authorization  • Rate Limiting         │    │
│  │  • Input Validation    • Error Handling • Security Headers     │    │
│  └────────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   Business Logic Layer                          │    │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐     │    │
│  │  │    KYC     │  │   Auth     │  │   Blockchain         │     │    │
│  │  │  Service   │  │  Service   │  │   Service Layer      │     │    │
│  │  └────────────┘  └────────────┘  └──────────────────────┘     │    │
│  └────────────────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   Data Access Layer                             │    │
│  │  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │  User  │  │   KYC    │  │   Bank   │  │Credential│         │    │
│  │  │ Model  │  │  Request │  │  Model   │  │  Model   │         │    │
│  │  └────────┘  └──────────┘  └──────────┘  └──────────┘         │    │
│  └────────────────────────────────────────────────────────────────┘    │
└──────────────┬─────────────────────────────────┬────────────────────────┘
               │                                 │
               ▼                                 ▼
┌───────────────────────────┐      ┌────────────────────────────────────┐
│   DATA LAYER (Docker)     │      │  BLOCKCHAIN LAYER (Hardhat)        │
│  ┌──────────────────────┐ │      │  ┌──────────────────────────────┐ │
│  │  MongoDB (27017)     │ │      │  │   Hardhat Network (8545)     │ │
│  │  - Users             │ │      │  │   ┌────────────────────────┐ │ │
│  │  - KYC Requests      │ │      │  │   │ CredentialRegistry.sol │ │ │
│  │  - Banks             │ │      │  │   │ (Smart Contract)       │ │ │
│  │  - Credentials       │ │      │  │   └────────────────────────┘ │ │
│  │  - Documents         │ │      │  │   - Issue Credentials        │ │
│  │  - Audit Logs        │ │      │  │   - Verify Credentials       │ │
│  └──────────────────────┘ │      │  │   - Revoke Credentials       │ │
│  ┌──────────────────────┐ │      │  │   - Manage Consent           │ │
│  │  Redis (6379)        │ │      │  └──────────────────────────────┘ │
│  │  - Session Cache     │ │      │                                    │
│  │  - Rate Limiting     │ │      │  Deployment: Hardhat Node / Sepolia│
│  │  - Token Blacklist   │ │      │  Network: localhost / testnet      │
│  └──────────────────────┘ │      └────────────────────────────────────┘
│  ┌──────────────────────┐ │
│  │ Mongo Express (8081) │ │
│  │ Redis Commander(8082)│ │
│  └──────────────────────┘ │
└───────────────────────────┘
```

---

## 🔄 System Workflow & Data Flow

### 1. User Registration & Authentication Flow

```
┌────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client   │         │   Backend    │         │  Database   │
│ (Frontend) │         │    (API)     │         │  (MongoDB)  │
└─────┬──────┘         └──────┬───────┘         └──────┬──────┘
      │                       │                        │
      │ 1. POST /auth/       │                        │
      │    register/customer  │                        │
      ├──────────────────────>│                        │
      │                       │                        │
      │                       │ 2. Validate Input      │
      │                       │    (express-validator) │
      │                       │                        │
      │                       │ 3. Hash Password       │
      │                       │    (bcrypt)            │
      │                       │                        │
      │                       │ 4. Create User         │
      │                       ├───────────────────────>│
      │                       │                        │
      │                       │ 5. User Created        │
      │                       │<───────────────────────┤
      │                       │                        │
      │                       │ 6. Generate JWT        │
      │                       │    (Access + Refresh)  │
      │                       │                        │
      │                       │ 7. Store Refresh Token │
      │                       │    in Redis            │
      │                       │                        │
      │ 8. Return Tokens +    │                        │
      │    User Data          │                        │
      │<──────────────────────┤                        │
      │                       │                        │
      │ 9. Store in Context   │                        │
      │    & LocalStorage     │                        │
      │                       │                        │
```

### 2. KYC Submission Flow (Customer)

```
┌────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────┐
│   Client   │    │   Backend    │    │  Database   │    │  Redis   │
└─────┬──────┘    └──────┬───────┘    └──────┬──────┘    └────┬─────┘
      │                  │                   │                 │
      │ 1. Upload KYC    │                   │                 │
      │    Documents     │                   │                 │
      │    + NID Data    │                   │                 │
      ├─────────────────>│                   │                 │
      │                  │                   │                 │
      │                  │ 2. Verify JWT     │                 │
      │                  │    Token          │                 │
      │                  ├──────────────────────────────────────>
      │                  │                   │                 │
      │                  │ 3. Validate NID   │                 │
      │                  │    Format         │                 │
      │                  │                   │                 │
      │                  │ 4. Check Existing │                 │
      │                  │    KYC Request    │                 │
      │                  ├──────────────────>│                 │
      │                  │                   │                 │
      │                  │ 5. Create KYC     │                 │
      │                  │    Request        │                 │
      │                  │    (Status:       │                 │
      │                  │     'submitted')  │                 │
      │                  ├──────────────────>│                 │
      │                  │                   │                 │
      │                  │ 6. Generate       │                 │
      │                  │    Request ID     │                 │
      │                  │    (KYC2412XXXXX) │                 │
      │                  │<──────────────────┤                 │
      │                  │                   │                 │
      │                  │ 7. Store Documents│                 │
      │                  │    (File System)  │                 │
      │                  │                   │                 │
      │ 8. Return        │                   │                 │
      │    Request ID    │                   │                 │
      │<─────────────────┤                   │                 │
      │                  │                   │                 │
```

### 3. KYC Verification Flow (Bank Officer)

```
┌────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│Bank Officer│    │   Backend    │    │  Database   │    │  Blockchain  │
└─────┬──────┘    └──────┬───────┘    └──────┬──────┘    └──────┬───────┘
      │                  │                   │                   │
      │ 1. GET /bank/    │                   │                   │
      │    kyc-requests  │                   │                   │
      ├─────────────────>│                   │                   │
      │                  │                   │                   │
      │                  │ 2. Check Role     │                   │
      │                  │    (bank_officer) │                   │
      │                  │                   │                   │
      │                  │ 3. Fetch Pending  │                   │
      │                  │    Requests       │                   │
      │                  ├──────────────────>│                   │
      │                  │<──────────────────┤                   │
      │                  │                   │                   │
      │ 4. Display Queue │                   │                   │
      │<─────────────────┤                   │                   │
      │                  │                   │                   │
      │ 5. Review KYC    │                   │                   │
      │    Details       │                   │                   │
      ├─────────────────>│                   │                   │
      │                  │                   │                   │
      │ 6. POST /bank/   │                   │                   │
      │    verify/:id    │                   │                   │
      │    {approved}    │                   │                   │
      ├─────────────────>│                   │                   │
      │                  │                   │                   │
      │                  │ 7. Update Status  │                   │
      │                  │    (approved)     │                   │
      │                  ├──────────────────>│                   │
      │                  │                   │                   │
      │                  │ 8. Update User    │                   │
      │                  │    KYC Status     │                   │
      │                  ├──────────────────>│                   │
      │                  │                   │                   │
      │ 9. POST /bank/   │                   │                   │
      │    issue-        │                   │                   │
      │    credential    │                   │                   │
      ├─────────────────>│                   │                   │
      │                  │                   │                   │
      │                  │ 10. Create Hash   │                   │
      │                  │     (SHA256)      │                   │
      │                  │                   │                   │
      │                  │ 11. Call Smart    │                   │
      │                  │     Contract      │                   │
      │                  ├────────────────────────────────────────>
      │                  │                   │                   │
      │                  │ 12. Issue         │                   │
      │                  │     Credential    │                   │
      │                  │     on Blockchain │                   │
      │                  │     (Transaction) │                   │
      │                  │                   │ 13. TX Hash +     │
      │                  │                   │     Block Number  │
      │                  │<────────────────────────────────────────
      │                  │                   │                   │
      │                  │ 14. Store         │                   │
      │                  │     Credential    │                   │
      │                  │     in DB         │                   │
      │                  ├──────────────────>│                   │
      │                  │                   │                   │
      │ 15. Success      │                   │                   │
      │     Response     │                   │                   │
      │<─────────────────┤                   │                   │
      │                  │                   │                   │
```

### 4. Credential Retrieval Flow (Customer)

```
┌────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│  Customer  │    │   Backend    │    │  Database   │    │  Blockchain  │
└─────┬──────┘    └──────┬───────┘    └──────┬──────┘    └──────┬───────┘
      │                  │                   │                   │
      │ 1. GET /kyc/     │                   │                   │
      │    credentials   │                   │                   │
      ├─────────────────>│                   │                   │
      │                  │                   │                   │
      │                  │ 2. Authenticate   │                   │
      │                  │    User           │                   │
      │                  │                   │                   │
      │                  │ 3. Query          │                   │
      │                  │    Credentials    │                   │
      │                  ├──────────────────>│                   │
      │                  │                   │                   │
      │                  │ 4. Retrieve       │                   │
      │                  │    TX Hash        │                   │
      │                  │<──────────────────┤                   │
      │                  │                   │                   │
      │                  │ 5. Verify on      │                   │
      │                  │    Blockchain     │                   │
      │                  ├────────────────────────────────────────>
      │                  │                   │                   │
      │                  │ 6. Credential     │                   │
      │                  │    Details        │                   │
      │                  │<────────────────────────────────────────
      │                  │                   │                   │
      │ 7. Display       │                   │                   │
      │    Credentials   │                   │                   │
      │<─────────────────┤                   │                   │
      │                  │                   │                   │
```

---

## 🗂️ Database Schema & Models

### MongoDB Collections

#### 1. Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed with bcrypt),
  role: Enum ['customer', 'bank_officer', 'admin'],
  
  personalInfo: {
    fullName: String,
    fullNameBangla: String,
    fatherName: String,
    motherName: String,
    dateOfBirth: Date,
    gender: Enum ['male', 'female', 'other'],
    nationality: String,
    nid: String (unique, 10/13/17 digits),
    passport: String (unique, format: XX1234567),
    birthCertificate: String (unique, 17 digits),
    taxIdentificationNumber: String (12 digits)
  },
  
  contactInfo: {
    primaryPhone: String (Bangladesh format),
    secondaryPhone: String,
    presentAddress: {
      division: Enum [8 divisions of Bangladesh],
      district: String,
      upazila: String,
      postCode: String (4 digits),
      addressLine: String
    },
    permanentAddress: { /* same structure */ },
    sameAsPresentAddress: Boolean
  },
  
  walletAddress: String (Ethereum address, indexed),
  
  bankOfficerInfo: {
    employeeId: String (unique),
    bankId: ObjectId (ref: Bank),
    branchCode: String,
    designation: String,
    permissions: [String]
  },
  
  kycStatus: Enum ['not_started', 'pending', 'under_review', 
                   'approved', 'rejected', 'expired'],
  kycLevel: Number [0, 1, 2, 3],
  kycCompletedAt: Date,
  kycExpiresAt: Date,
  
  isActive: Boolean (indexed),
  isEmailVerified: Boolean,
  isPhoneVerified: Boolean,
  twoFactorEnabled: Boolean,
  
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  
  consentGiven: {
    dataProcessing: { granted: Boolean, grantedAt: Date },
    dataSharing: { granted: Boolean, grantedAt: Date },
    blockchainStorage: { granted: Boolean, grantedAt: Date }
  },
  
  timestamps: { createdAt: Date, updatedAt: Date }
}
```

#### 2. KYC Requests Collection
```javascript
{
  _id: ObjectId,
  requestId: String (unique, format: KYC2412XXXXX),
  userId: ObjectId (ref: User, indexed),
  bankId: ObjectId (ref: Bank, indexed),
  
  requestType: Enum ['new', 'update', 'renewal', 'upgrade'],
  kycLevel: Number [1, 2, 3],
  
  status: Enum ['draft', 'submitted', 'pending', 
                'document_verification', 'under_review',
                'additional_info_required', 'approved', 
                'rejected', 'expired', 'cancelled'],
  
  statusHistory: [{
    status: String,
    changedAt: Date,
    changedBy: ObjectId (ref: User),
    remarks: String,
    ipAddress: String
  }],
  
  workflow: {
    submittedAt: Date,
    reviewStartedAt: Date,
    reviewCompletedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    expiresAt: Date,
    assignedTo: ObjectId (ref: User),
    reviewedBy: ObjectId (ref: User),
    approvedBy: ObjectId (ref: User)
  },
  
  documents: [{
    documentId: ObjectId (ref: Document),
    documentType: Enum ['nid_front', 'nid_back', 'passport', ...],
    status: Enum ['pending', 'verified', 'rejected', 'expired'],
    verifiedAt: Date,
    verifiedBy: ObjectId (ref: User),
    remarks: String
  }],
  
  verificationChecks: {
    nidVerification: {
      status: Enum ['pending', 'success', 'failed'],
      verifiedAt: Date,
      remarks: String
    },
    faceMatch: {
      status: Enum ['pending', 'success', 'failed'],
      confidenceScore: Number,
      verifiedAt: Date
    },
    addressVerification: { /* similar */ },
    phoneVerification: { /* similar */ },
    emailVerification: { /* similar */ },
    biometricVerification: { /* similar */ }
  },
  
  amlScreening: {
    status: Enum ['pending', 'clear', 'flagged', 'blocked'],
    screenedAt: Date,
    watchlistMatch: Boolean,
    pep: Boolean,
    sanctionsList: Boolean,
    adverseMedia: Boolean,
    remarks: String
  },
  
  blockchain: {
    credentialHash: String (indexed),
    transactionHash: String (unique),
    blockNumber: Number,
    issuedOnChain: Boolean,
    issuedAt: Date
  },
  
  metrics: {
    submissionDuration: Number,
    reviewDuration: Number,
    totalProcessingTime: Number,
    numberOfRevisions: Number,
    officerChanges: Number
  },
  
  priority: Enum ['low', 'normal', 'high', 'urgent'],
  
  timestamps: { createdAt: Date, updatedAt: Date }
}
```

#### 3. Credentials Collection
```javascript
{
  _id: ObjectId,
  credentialId: String (blockchain credential ID),
  userId: ObjectId (ref: User, indexed),
  kycRequestId: ObjectId (ref: KycRequest),
  
  credentialType: Number [1: Student ID, 2: KYC],
  credentialHash: String (SHA256 hash),
  
  issuer: {
    address: String (Ethereum address),
    bankId: ObjectId (ref: Bank),
    officerId: ObjectId (ref: User)
  },
  
  holder: {
    address: String (Ethereum address),
    userId: ObjectId (ref: User)
  },
  
  blockchain: {
    transactionHash: String (unique, indexed),
    blockNumber: Number,
    network: String,
    issuedAt: Date,
    gasUsed: String,
    confirmations: Number
  },
  
  status: Enum ['active', 'revoked', 'expired'],
  isRevoked: Boolean,
  revokedAt: Date,
  revokedBy: ObjectId (ref: User),
  revokeReason: String,
  
  expiresAt: Date,
  
  metadata: {
    version: String,
    schema: String
  },
  
  timestamps: { createdAt: Date, updatedAt: Date }
}
```

#### 4. Banks Collection
```javascript
{
  _id: ObjectId,
  name: String (unique),
  swiftCode: String (unique),
  routingNumber: String (unique),
  
  contactInfo: {
    headOfficeAddress: String,
    phone: String,
    email: String,
    website: String
  },
  
  walletAddress: String (Ethereum address),
  isAuthorizedIssuer: Boolean,
  authorizedAt: Date,
  
  isActive: Boolean,
  
  timestamps: { createdAt: Date, updatedAt: Date }
}
```

#### 5. Consents Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  credentialId: String (blockchain credential ID),
  
  verifier: {
    address: String (Ethereum address),
    organization: String,
    purpose: String
  },
  
  consentType: Enum ['view', 'share', 'verify'],
  
  grantedAt: Date,
  expiresAt: Date,
  revokedAt: Date,
  
  blockchain: {
    transactionHash: String,
    blockNumber: Number
  },
  
  status: Enum ['active', 'expired', 'revoked'],
  
  timestamps: { createdAt: Date, updatedAt: Date }
}
```

---

## 🔗 Smart Contract Architecture

### CredentialRegistry.sol

**Location**: `/blockchain/contracts/CredentialRegistry.sol`  
**Solidity Version**: ^0.8.0  
**Network**: Hardhat Local (Development) / Sepolia (Testnet)

#### Contract Structure

```solidity
contract CredentialRegistry {
    // Data Structures
    struct Credential {
        bytes32 credentialHash;      // SHA256 hash of credential data
        address issuer;               // Bank's Ethereum address
        address holder;               // Customer's Ethereum address
        uint256 issuedAt;            // Timestamp
        bool isRevoked;              // Revocation status
        uint256 credentialType;       // 1 = Student ID, 2 = KYC
    }
    
    // State Variables
    mapping(bytes32 => Credential) public credentials;
    mapping(address => bytes32[]) public holderCredentials;
    mapping(address => bool) public authorizedIssuers;
    address public admin;
    
    // Events
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
    
    // Functions
    function addAuthorizedIssuer(address _issuer) public onlyAdmin
    function issueCredential(...) public onlyAuthorizedIssuer returns (bytes32)
    function verifyCredential(...) public view returns (bool)
    function revokeCredential(bytes32 _credentialId) public
    function grantConsent(...) public
    function getCredential(...) public view returns (...)
    function getHolderCredentials(address _holder) public view returns (bytes32[])
}
```

#### Key Functions

1. **addAuthorizedIssuer**: Admin adds banks as authorized issuers
2. **issueCredential**: Banks issue credentials on-chain
3. **verifyCredential**: Anyone can verify a credential's validity
4. **revokeCredential**: Issuer can revoke credentials
5. **grantConsent**: Holders grant access to verifiers

---

## 🔌 API Endpoints Architecture

### Base URL Structure
```
Development: http://localhost:5000/api/v1
Production: https://api.ekyc.com/api/v1
```

### 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register/customer` | Public | Register new customer |
| POST | `/register/bank-officer` | Public | Register bank officer |
| POST | `/login` | Public | User authentication |
| POST | `/refresh` | Public | Refresh access token |
| GET | `/me` | Private | Get current user profile |
| POST | `/logout` | Private | Logout and blacklist token |

**Authentication Flow**:
- JWT-based authentication with access (15min) and refresh (7days) tokens
- Tokens stored in Redis for blacklist checking
- Password hashing with bcrypt (12 rounds)

### 2. KYC Endpoints (`/api/v1/kyc`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/submit` | Customer | Submit new KYC request |
| GET | `/status/:requestId` | Customer | Check KYC status |
| GET | `/history` | Customer | Get KYC request history |
| GET | `/credentials` | Customer | List blockchain credentials |
| GET | `/credentials/:id` | Customer | Get specific credential |

**KYC Submission Process**:
1. Validate NID format (10/13/17 digits)
2. Check for existing pending requests
3. Create KYC request with auto-generated ID
4. Store documents in file system
5. Return request ID and status

### 3. Bank Officer Endpoints (`/api/v1/bank`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/kyc-requests` | Bank Officer | List pending requests |
| GET | `/kyc-request/:id` | Bank Officer | Get request details |
| POST | `/verify/:requestId` | Bank Officer | Approve/reject KYC |
| POST | `/issue-credential` | Bank Officer | Issue blockchain credential |

**Verification Process**:
1. Authenticate bank officer
2. Fetch KYC request details
3. Review documents and data
4. Update status (approved/rejected)
5. If approved, issue blockchain credential

### 4. Consent Endpoints (`/api/v1/consent`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/grant` | Customer | Grant credential access |
| GET | `/list` | Customer | List granted consents |
| POST | `/revoke/:id` | Customer | Revoke consent |

---

## 🧩 Backend Service Layer

### Blockchain Service Architecture

**Location**: `/backend/src/services/blockchain/`

#### Components Hierarchy

```
blockchain/
├── index.js                    # Main export
├── CredentialService.js        # High-level API (4,540 lines total)
├── core/
│   └── BlockchainProvider.js   # Network connection management
├── managers/
│   ├── WalletManager.js        # Wallet operations
│   ├── ContractManager.js      # Smart contract interaction
│   ├── TransactionManager.js   # Transaction execution
│   ├── EventListener.js        # Blockchain event monitoring
│   └── TransactionQueue.js     # Priority-based queue
└── utils/
    ├── validators.js           # Input validation
    ├── helpers.js              # Utility functions
    ├── logger.js               # Structured logging
    ├── constants.js            # Configuration constants
    └── errors.js               # Custom error classes (14 types)
```

#### Key Service Functions

**CredentialService** (Main Interface):
```javascript
class CredentialService {
  // Credential Operations
  async issueCredential(holderAddress, credentialType, credentialData)
  async verifyCredential(credentialId, credentialHash)
  async revokeCredential(credentialId)
  async getCredential(credentialId)
  async getHolderCredentials(holderAddress)
  
  // Consent Management
  async grantConsent(verifier, credentialId)
  
  // Administrative
  async addAuthorizedIssuer(issuerAddress)
  async isAuthorizedIssuer(address)
  
  // Wallet Management
  async getWalletBalance()
  async generateWallet()
  
  // Event Listening
  async startEventListener(callback)
  async stopEventListener()
  
  // Network & Health
  async getNetworkInfo()
  async healthCheck()
}
```

**Transaction Flow**:
1. Validate inputs
2. Estimate gas with buffer (20%)
3. Build transaction with EIP-1559 or legacy gas
4. Sign with private key
5. Submit to network
6. Wait for confirmation (configurable blocks)
7. Retry on failure (exponential backoff)
8. Return transaction receipt

---

## 🎨 Frontend Architecture

### Technology Stack
- **Framework**: React 18.3.1 + TypeScript
- **Routing**: React Router DOM v6
- **State Management**: Context API + React Query
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite

### Component Structure

```
frontend/src/
├── main.tsx                    # Application entry
├── App.tsx                     # Route configuration
├── components/
│   ├── Layout.tsx              # Main layout wrapper
│   ├── PrivateRoute.tsx        # Protected route HOC
│   ├── LoadingSpinner.tsx      # Loading indicator
│   ├── Header.tsx              # Navigation header
│   ├── Footer.tsx              # Page footer
│   └── forms/                  # Form components
├── pages/
│   ├── HomePage.tsx            # Landing page
│   ├── LoginPage.tsx           # Authentication
│   ├── RegisterCustomerPage.tsx
│   ├── RegisterBankOfficerPage.tsx
│   ├── DashboardPage.tsx       # Customer dashboard
│   ├── SubmitKycPage.tsx       # KYC submission
│   ├── KycStatusPage.tsx       # Status tracking
│   ├── KycHistoryPage.tsx      # Request history
│   ├── CredentialsPage.tsx     # List credentials
│   ├── CredentialDetailPage.tsx
│   ├── ConsentsPage.tsx        # Consent management
│   ├── ProfilePage.tsx         # User profile
│   ├── OfficerDashboardPage.tsx
│   ├── KycQueuePage.tsx        # Pending requests
│   ├── ReviewKycPage.tsx       # Review interface
│   ├── IssueCredentialPage.tsx # Blockchain issuance
│   └── NotFoundPage.tsx
├── contexts/
│   └── AuthContext.tsx         # Authentication state
├── services/
│   ├── apiClient.ts            # Axios instance
│   ├── authService.ts          # Auth API calls
│   ├── kycService.ts           # KYC API calls
│   ├── bankService.ts          # Bank API calls
│   └── consentService.ts       # Consent API calls
├── types/
│   └── index.ts                # TypeScript definitions
└── utils/
    ├── formatters.ts           # Data formatting
    └── validators.ts           # Client-side validation
```

### State Management Pattern

**AuthContext** manages:
- User authentication state
- JWT tokens (localStorage)
- User profile data
- Login/logout actions
- Token refresh logic

**React Query** manages:
- API request caching
- Automatic refetching
- Loading/error states
- Mutation handling

### Routing Architecture

```javascript
// Public Routes
/ → HomePage
/login → LoginPage
/register/customer → RegisterCustomerPage
/register/bank-officer → RegisterBankOfficerPage

// Protected Routes (Customer)
/dashboard → DashboardPage (auto-redirect based on role)
/kyc/submit → SubmitKycPage
/kyc/status/:requestId → KycStatusPage
/kyc/history → KycHistoryPage
/credentials → CredentialsPage
/credentials/:credentialId → CredentialDetailPage
/consents → ConsentsPage
/profile → ProfilePage

// Protected Routes (Bank Officer)
/officer/dashboard → OfficerDashboardPage
/officer/kyc-requests → KycQueuePage
/officer/kyc-request/:id → ReviewKycPage
/officer/issue-credential/:requestId → IssueCredentialPage
```

---

## 🔒 Security Architecture

### 1. Authentication & Authorization

**JWT Token System**:
```javascript
// Access Token (15 minutes)
{
  id: userId,
  email: userEmail,
  role: userRole,
  iat: issuedAt,
  exp: expiresAt
}

// Refresh Token (7 days)
{
  id: userId,
  type: 'refresh',
  iat: issuedAt,
  exp: expiresAt
}
```

**Token Storage**:
- Frontend: localStorage (secure context)
- Backend: Redis (blacklist, TTL)

**Authorization Middleware**:
```javascript
// Role-based access control
authenticate → protect → authorize(['customer'])
authenticate → protect → authorize(['bank_officer'])
authenticate → protect → authorize(['admin'])
```

### 2. Input Validation

**Backend Validation** (express-validator + Joi):
- Schema validation for all inputs
- NID format validation (Bangladesh)
- Phone number validation (+880)
- Email format validation
- Password strength requirements

**Frontend Validation** (TypeScript + Custom):
- Type safety with TypeScript
- Real-time form validation
- Client-side sanitization

### 3. Security Middleware Stack

```javascript
// Applied in order
1. Helmet - Security headers
2. CORS - Cross-origin resource sharing
3. Rate Limiting - Prevent brute force (100 req/15min)
4. Body Parser - JSON parsing (10MB limit)
5. Mongo Sanitize - NoSQL injection prevention
6. XSS Filter - Cross-site scripting prevention
7. HPP - HTTP parameter pollution prevention
8. Compression - Response compression
```

### 4. Database Security

**MongoDB**:
- Authentication enabled (username/password)
- Unique indexes on sensitive fields
- Sparse indexes for optional unique fields
- Password hashing (bcrypt, 12 rounds)
- Connection string with credentials

**Redis**:
- Password protection
- TTL for temporary data
- Key namespacing

### 5. Blockchain Security

**Smart Contract**:
- Access control (onlyAdmin, onlyAuthorizedIssuer)
- Reentrancy protection (not applicable, no transfers)
- Input validation on-chain
- Event emission for auditability

**Private Key Management**:
- Environment variables only
- Never commit to version control
- Separate keys per environment

---

## 🐳 Infrastructure & Deployment

### Docker Compose Services

```yaml
services:
  mongodb:
    image: mongo:7.0
    port: 27017
    volumes: mongodb_data
    credentials: admin / eKYC_Admin_2025
    
  redis:
    image: redis:7-alpine
    port: 6379
    password: eKYC_Redis_2025
    persistence: AOF enabled
    
  mongo-express:
    image: mongo-express:latest
    port: 8081
    credentials: admin / admin123
    
  redis-commander:
    image: rediscommander/redis-commander
    port: 8082
```

### Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | React development server |
| Backend API | 5000 | Express REST API |
| MongoDB | 27017 | Database |
| Redis | 6379 | Cache & sessions |
| Hardhat Node | 8545 | Blockchain network |
| Mongo Express | 8081 | Database GUI |
| Redis Commander | 8082 | Cache GUI |

### Environment Configuration

**Backend (.env)**:
```bash
# Server
PORT=5000
NODE_ENV=development
API_VERSION=v1

# Database
MONGODB_URI=mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_db?authSource=admin
REDIS_URL=redis://:eKYC_Redis_2025@localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Blockchain
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Blockchain (.env)**:
```bash
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=YOUR_KEY
```

---

## 🧪 Testing Architecture

### Test Structure

```
backend/src/tests/
├── api/
│   └── integration.test.js     # API integration tests
├── services/
│   └── blockchain/
│       └── __tests__/          # Blockchain service tests
└── models/
    └── __tests__/              # Model validation tests

blockchain/test/
└── CredentialRegistry.test.js  # Smart contract tests
```

### Test Coverage

**Backend Tests**:
- Integration tests for all API endpoints
- Unit tests for blockchain service
- Model validation tests
- Coverage: ~85%

**Smart Contract Tests**:
- Mocha + Chai + Hardhat
- Deployment tests
- Access control tests
- Credential lifecycle tests
- Event emission tests
- Coverage: 100%

### Running Tests

```bash
# Backend Tests
cd backend
npm test                        # All tests
npm run test:integration        # Integration only
npm run test:unit              # Unit only
npm run test:blockchain        # Blockchain service
npm run test:e2e               # End-to-end

# Blockchain Tests
cd blockchain
npm test                        # Contract tests
npm run test:coverage          # With coverage
npm run test:gas               # Gas reporting
```

---

## 📊 Performance & Optimization

### Database Indexing Strategy

**Users Collection**:
- Single indexes: email, nid, walletAddress, kycStatus, role
- Compound indexes: (email, isActive), (kycStatus, role)

**KYC Requests**:
- Single indexes: requestId, userId, bankId, status
- Compound indexes: (userId, status), (bankId, status), (status, priority, createdAt)
- TTL index: expiresAt (auto-delete after 90 days)

**Credentials**:
- Single indexes: credentialId, transactionHash, userId
- Compound indexes: (userId, status)

### Caching Strategy

**Redis Usage**:
1. **Session Cache**: JWT refresh tokens
2. **Rate Limiting**: Request counting
3. **Token Blacklist**: Logged out tokens
4. **Temporary Data**: OTP codes, verification tokens

### API Rate Limiting

```javascript
// Configuration
windowMs: 15 * 60 * 1000     // 15 minutes
max: 100                      // 100 requests
message: 'Too many requests'
```

**Disabled in**: Test environment

---

## 🚀 Deployment Workflow

### Development Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd eKYC

# 2. Start Docker services
docker-compose up -d

# 3. Install dependencies
npm install                    # Root (demo script)
cd backend && npm install
cd ../blockchain && npm install
cd ../frontend && npm install

# 4. Configure environment
cp backend/.env.example backend/.env
cp blockchain/.env.example blockchain/.env
# Edit .env files

# 5. Start Hardhat blockchain
cd blockchain
npm run node                   # Terminal 1

# 6. Deploy smart contract
cd blockchain
npm run deploy:local           # Terminal 2
# Copy contract address to backend/.env

# 7. Start backend server
cd backend
npm run dev                    # Terminal 3

# 8. Start frontend
cd frontend
npm run dev                    # Terminal 4

# 9. Access application
Frontend: http://localhost:3000
Backend: http://localhost:5000
```

### Production Deployment

1. **Frontend**:
   - Build: `npm run build:production`
   - Deploy to: Vercel / Netlify / AWS S3 + CloudFront
   - Environment: Production API URL

2. **Backend**:
   - Deploy to: AWS EC2 / DigitalOcean / Heroku
   - Process manager: PM2
   - Reverse proxy: Nginx
   - SSL: Let's Encrypt

3. **Database**:
   - MongoDB Atlas (cloud)
   - Redis Cloud / AWS ElastiCache

4. **Blockchain**:
   - Deploy to Sepolia testnet
   - Production: Ethereum mainnet
   - Infura / Alchemy RPC endpoint

---

## 🔄 Data Synchronization

### Blockchain ↔ Database Sync

**On Credential Issuance**:
1. Backend creates credential hash
2. Calls smart contract `issueCredential()`
3. Waits for transaction confirmation
4. Stores transaction hash + block number in MongoDB
5. Updates KYC request status
6. Returns success to frontend

**Event Listener** (Optional):
- Listens for `CredentialIssued` events
- Reconciles with database records
- Alerts on mismatches

### User Wallet Management

**Customer**:
- Wallet generated automatically on first KYC approval
- Private key encrypted and stored (future enhancement)
- Public address stored in User model

**Bank Officer**:
- Wallet configured via environment variable
- Must be authorized issuer on smart contract
- Shared wallet per bank (current) or individual (future)

---

## 📈 Scalability Considerations

### Current Architecture Supports:

1. **Horizontal Scaling**:
   - Stateless backend (can run multiple instances)
   - Load balancer in front (Nginx/ALB)
   - Shared Redis for session sync

2. **Database Scaling**:
   - MongoDB sharding (by userId)
   - Read replicas for queries
   - Connection pooling (Mongoose)

3. **Blockchain Scaling**:
   - Transaction queue for high volume
   - Batch processing support
   - Multiple issuer wallets

4. **Caching**:
   - Redis for hot data
   - API response caching (future)
   - CDN for frontend assets

### Performance Metrics:

- API Response Time: < 200ms (avg)
- Database Query Time: < 50ms (indexed)
- Blockchain Transaction: 2-15 seconds (network dependent)
- Concurrent Users: 1000+ (with scaling)

---

## 🛠️ Development Tools & Scripts

### Backend Scripts

```bash
npm start              # Production server
npm run dev           # Development (nodemon)
npm test              # All tests
npm run lint          # ESLint
npm run seed          # Seed database
npm run migrate       # Run migrations
```

### Blockchain Scripts

```bash
npm run compile       # Compile contracts
npm test              # Run tests
npm run node          # Start Hardhat network
npm run deploy:local  # Deploy to local
npm run deploy:sepolia # Deploy to Sepolia
npm run verify:sepolia # Verify on Etherscan
npm run flatten       # Flatten contract
```

### Frontend Scripts

```bash
npm run dev           # Development server
npm run build         # Production build
npm run preview       # Preview build
npm run lint          # ESLint
npm run type-check    # TypeScript check
```

### Utility Scripts

```bash
# Root directory
./start-all.sh                 # Start all services
node scripts/demo-flow.js      # Run demo workflow
./backend/show-stats.sh        # Show test statistics
```

---

## 📚 Documentation Files

### Project Documentation

- `README.md` - Main project overview
- `backend/API_DOCUMENTATION.md` - Complete API reference (1161 lines)
- `backend/QUICK_START.md` - Detailed setup guide
- `BLOCKCHAIN_SERVICE_SUMMARY.md` - Blockchain implementation (589 lines)
- `DEMO_GUIDE.md` - Demo workflow instructions
- `TESTING_QUICK_START.md` - Testing guide

### Technical Documentation

- `backend/BACKEND_TECHNICAL_DOCUMENTATION.md` - Backend architecture
- `backend/MONGOOSE_SCHEMAS_README.md` - Database models
- `backend/KYC_SERVICE_SUMMARY.md` - KYC service details
- `blockchain/README.md` - Smart contract documentation
- `frontend/INTEGRATION_SUMMARY.md` - Frontend integration

---

## 🎯 Key Features Summary

### Customer Features
1. ✅ User registration and authentication
2. ✅ KYC request submission with NID verification
3. ✅ Real-time KYC status tracking
4. ✅ KYC request history
5. ✅ Blockchain credential retrieval
6. ✅ Consent management for credential sharing
7. ✅ Profile management

### Bank Officer Features
1. ✅ Officer registration and authentication
2. ✅ View pending KYC request queue
3. ✅ Review KYC request details
4. ✅ Approve/reject KYC requests
5. ✅ Issue blockchain credentials
6. ✅ View credential issuance history

### System Features
1. ✅ JWT-based authentication with refresh tokens
2. ✅ Role-based access control (RBAC)
3. ✅ Rate limiting and security headers
4. ✅ NoSQL injection and XSS prevention
5. ✅ Comprehensive error handling
6. ✅ Audit logging
7. ✅ Event-based architecture
8. ✅ Blockchain integration with retry logic
9. ✅ Transaction queue management
10. ✅ Real-time event listening

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Email/SMS notifications
- [ ] Document OCR and AI verification
- [ ] Facial recognition integration
- [ ] Multi-signature approval workflow
- [ ] Credential revocation on blockchain
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Mobile application (React Native)
- [ ] Biometric verification
- [ ] Integration with government databases
- [ ] Multi-language support (English + Bangla)
- [ ] Bulk KYC processing

### Technical Improvements
- [ ] WebSocket for real-time updates
- [ ] GraphQL API option
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated backup and recovery
- [ ] Performance monitoring (Datadog/New Relic)
- [ ] Log aggregation (ELK stack)

---

## 🤝 Integration Points

### External Systems (Future)
1. **NID Verification API** - Bangladesh Election Commission
2. **SMS Gateway** - Twilio / Local providers
3. **Email Service** - SendGrid / AWS SES
4. **Payment Gateway** - For fees (if applicable)
5. **OCR Service** - Google Vision / AWS Textract
6. **Face Recognition** - AWS Rekognition / Azure Face API
7. **AML Screening** - ComplyAdvantage / Refinitiv

### Current Integrations
1. **MongoDB** - Primary database
2. **Redis** - Caching and sessions
3. **Ethereum** - Blockchain network (Hardhat/Sepolia)
4. **Infura/Alchemy** - Blockchain RPC (production)

---

## 📝 Code Statistics

### Total Lines of Code
- **Backend**: ~15,000 lines (JavaScript)
- **Frontend**: ~8,000 lines (TypeScript + TSX)
- **Blockchain Service**: ~4,540 lines (JavaScript)
- **Smart Contracts**: ~120 lines (Solidity)
- **Tests**: ~5,000 lines
- **Documentation**: ~10,000 lines (Markdown)

**Total Project**: ~42,660 lines

### File Count
- Backend: 150+ files
- Frontend: 80+ files
- Blockchain: 40+ files
- Documentation: 25+ files

---

## 🎓 Technologies Used

### Frontend
- React 18.3.1
- TypeScript 5.6.2
- React Router DOM 6.30.1
- Axios 1.7.7
- Tailwind CSS 3.4.13
- Vite 5.4.20
- Lucide React 0.462.0
- TanStack React Query 5.90.5

### Backend
- Node.js 18+
- Express 4.21.1
- Mongoose 8.7.2
- Redis (ioredis 5.4.1)
- JWT (jsonwebtoken 9.0.2)
- bcrypt 2.4.3
- ethers.js 6.13.4
- Helmet, CORS, express-validator
- Winston (logging)
- Joi (validation)
- Multer (file upload)

### Blockchain
- Hardhat 2.26.3
- Solidity 0.8.x
- ethers.js 6.15.0
- OpenZeppelin Contracts 5.0.2
- Chai, Mocha (testing)

### DevOps
- Docker & Docker Compose
- MongoDB 7.0
- Redis 7 Alpine
- Git & GitHub

### Testing
- Jest 29.7.0
- Supertest 7.0.0
- MongoDB Memory Server 10.0.1
- Hardhat Testing Framework

---

## 🌐 Network Topology

```
Internet
    │
    ├─── Users (Customers, Bank Officers)
    │
    ▼
Load Balancer (Nginx/ALB)
    │
    ├─── Frontend Server(s) [Port 3000]
    │    └─── Static Assets (CDN)
    │
    ├─── Backend API Server(s) [Port 5000]
    │    ├─── Express Application
    │    ├─── JWT Middleware
    │    └─── Business Logic
    │
    ├─── Database Cluster
    │    ├─── MongoDB Primary [Port 27017]
    │    ├─── MongoDB Replicas
    │    └─── Redis [Port 6379]
    │
    └─── Blockchain Network
         ├─── Ethereum Node (Infura/Alchemy)
         └─── Smart Contract (CredentialRegistry)
```

---

## 🔐 Access Control Matrix

| Feature | Customer | Bank Officer | Admin |
|---------|----------|--------------|-------|
| Register Account | ✅ | ✅ | ❌ |
| Login | ✅ | ✅ | ✅ |
| Submit KYC | ✅ | ❌ | ❌ |
| View Own KYC Status | ✅ | ❌ | ✅ |
| View KYC Queue | ❌ | ✅ | ✅ |
| Approve/Reject KYC | ❌ | ✅ | ✅ |
| Issue Credential | ❌ | ✅ | ✅ |
| View Own Credentials | ✅ | ❌ | ✅ |
| Grant Consent | ✅ | ❌ | ❌ |
| Revoke Consent | ✅ | ❌ | ✅ |
| Manage Banks | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ✅ | ✅ |
| System Configuration | ❌ | ❌ | ✅ |

---

## 📞 Support & Maintenance

### Error Monitoring
- Console logging (development)
- Winston logging (production)
- Error tracking (future: Sentry)

### Backup Strategy
- MongoDB: Daily automated backups
- Redis: AOF persistence
- Code: Git version control
- Blockchain: Immutable by nature

### Maintenance Windows
- Backend updates: Rolling deployment (zero downtime)
- Database migrations: Scheduled maintenance
- Smart contract: Immutable (new deployment for changes)

---

## 🎉 Project Status

**Current Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: ✅ Production Ready

**Achievements**:
- ✅ Complete authentication system
- ✅ Full KYC workflow implementation
- ✅ Blockchain integration operational
- ✅ Frontend UI completed
- ✅ Comprehensive testing (85%+ coverage)
- ✅ API documentation complete
- ✅ Docker deployment ready
- ✅ Demo flow functional

---

## 📖 Quick Start Commands

```bash
# Development Quick Start
git clone <repo>
cd eKYC
docker-compose up -d
./start-all.sh

# Access Points
Frontend: http://localhost:3000
Backend: http://localhost:5000
Mongo Express: http://localhost:8081
Redis Commander: http://localhost:8082

# Test Credentials (from demo)
Customer: customer_<timestamp>@example.com / Customer@123
Officer: officer_<timestamp>@example.com / Officer@123

# Demo Workflow
node scripts/demo-flow.js
```

---

## 🏆 Best Practices Implemented

1. **Code Organization**: Modular architecture, separation of concerns
2. **Security**: Multiple layers of protection, input validation
3. **Testing**: Comprehensive test coverage, CI/CD ready
4. **Documentation**: Extensive inline and external docs
5. **Error Handling**: Graceful degradation, user-friendly messages
6. **Logging**: Structured logging for debugging
7. **Scalability**: Horizontal scaling ready
8. **Performance**: Indexed queries, caching, optimization
9. **Maintainability**: Clean code, consistent style
10. **Version Control**: Git with feature branches

---

## 📄 License

MIT License - See LICENSE file

---

**END OF CONTEXT DOCUMENT**

*This document provides a complete architectural overview of the eKYC Blockchain System. Use this as a reference for understanding system design, data flow, technology stack, and implementation details.*
