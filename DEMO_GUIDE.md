# Complete Demo Guide

This comprehensive guide covers all demo options for the eKYC system, including quick demos, live blockchain demos, and presentation guides.

## Table of Contents
- [Quick Demo Options](#quick-demo-options)
- [Live Blockchain Demo](#live-blockchain-demo)
- [Presentation Guide](#presentation-guide)
- [Demo Script Status](#demo-script-status)
- [Troubleshooting](#troubleshooting)

---

## Quick Demo Options

### Option 1: Mock Demo (Recommended - Always Works)

Complete working demonstration without needing blockchain:

```bash
cd backend
node demo-blockchain-mock.js
```

**Duration**: ~30 seconds
**Requirements**: None (just Node.js)
**Shows**: All 7 steps of credential lifecycle

**Expected Output:**
- ✅ Service initialization
- ✅ Credential issuance
- ✅ Credential verification
- ✅ Credential retrieval
- ✅ Consent management
- ✅ System health checks

### Option 2: Statistics Demo (Best Starting Point)

Shows impressive numbers without running code:

```bash
cd backend
./show-stats.sh
```

**Shows:**
- **7,709 lines** of production code
- **186 test cases**
- **16 modular service files**
- Complete blockchain integration

### Option 3: Code Structure Demo

Show the architecture:

```bash
tree backend/src/services/blockchain/ -L 2 -I node_modules
```

---

## Live Blockchain Demo

### Prerequisites

- Hardhat node running
- Smart contracts deployed
- Backend server running

### Setup Steps

**Terminal 1 - Start Blockchain:**
```bash
cd blockchain
npx hardhat node
```

Leave this running! You should see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

**Terminal 2 - Run the Demo:**
Wait until you see "Account #0" addresses in Terminal 1, then:
```bash
cd backend
node demo-blockchain.js
```

### What You'll See:

1. ✅ Connecting to blockchain
2. ✅ Loading wallet
3. ✅ Checking balance (10,000 ETH)
4. ✅ Issuing credential with real transaction
5. ✅ Verifying credential on-chain
6. ✅ Retrieving credential data
7. ✅ Granting consent

### Alternative: Full Setup Script

If you have the demo setup script:
```bash
cd backend
node demo/01-populate-database.js    # Populate database
node demo/02-issue-credential-blockchain.js  # Issue credential
node demo/03-query-demo-data.js      # Show all data
```

---

## Presentation Guide

### Recommended Demo Flow (5-20 minutes)

#### For 5-Minute Demo:
1. Run `./DEMO_TOMORROW.sh` (if available)
2. Choose **Option 1** (Statistics) - 1 minute
3. Choose **Option 2** (Mock Demo) - 2 minutes
4. Choose **Option 4** (Code Structure) - 1 minute
5. Briefly mention the test suite - 30 seconds

#### For 10-Minute Demo:
1. Run `./DEMO_TOMORROW.sh`
2. Choose **Option 6** (Full Demo Sequence)
3. This runs everything automatically with pauses between sections

#### For Quick Showcase (2 minutes):
```bash
cd backend
node demo-blockchain-mock.js
```
Then just highlight the final statistics it displays.

### Phase-by-Phase Presentation

#### Phase 1: System Architecture Introduction (3 min)
Explain the key components:
- **Backend**: Node.js + Express with MongoDB for data storage
- **Blockchain**: Ethereum smart contracts for credential verification
- **Database**: MongoDB for business logic, Redis for caching
- **Smart Contract**: CredentialRegistry for tamper-proof credential storage

#### Phase 2: Database Setup (5 min)

**Step 1: Show Running Services**
```bash
# From project root
cd backend

# Show Docker containers are running
docker-compose ps
```

**Expected Output:**
- MongoDB (27017)
- Redis (6379)
- Mongo Express UI (8081)
- Redis Commander (8082)

**Step 2: Populate Database with Demo Data**
```bash
# Run the database population script
node demo/01-populate-database.js
```

**What This Creates:**
- ✅ 2 Banks (Dutch Bangla Bank, BRAC Bank)
- ✅ 1 Bank Officer (Kamal Ahmed)
- ✅ 2 Customers (Abdul Rahim, Fatema Begum)
- ✅ 1 Submitted KYC Request
- ✅ 1 Verified Document (NID Front)

**Step 3: Show Data in MongoDB Express**
Open browser: `http://localhost:8081`

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

#### Phase 3: Blockchain Integration (7 min)

**Step 1: Start Hardhat Local Node (If not running)**
Open a **NEW terminal**:
```bash
cd blockchain
npx hardhat node
```

**Keep this terminal open** - it shows blockchain transactions in real-time!

**Step 2: Issue Credential on Blockchain**
In the original terminal:
```bash
cd backend
node demo/02-issue-credential-blockchain.js
```

**What This Does:**
1. ✅ Finds the submitted KYC request
2. ✅ Retrieves the document hash
3. ✅ Connects to the blockchain
4. ✅ Issues a credential on the smart contract
5. ✅ Updates the database with blockchain transaction details
6. ✅ Approves the KYC request
7. ✅ Verifies the credential is stored correctly

**Key Points to Highlight:**
- Transaction hash (proof of blockchain storage)
- Block number (immutable record)
- Credential ID (unique identifier)
- Gas usage (blockchain transaction cost)
- Verification status (✅ verified on-chain)

**Step 3: Show Updated Data**
```bash
node demo/03-query-demo-data.js
```

This shows a **complete report** including:
- All banks and their blockchain status
- Bank officers and customers
- KYC requests with **blockchain transaction details**
- Documents with verification status
- System statistics

#### Phase 4: Smart Contract Verification (3 min)

**View Blockchain Data Directly**
In Hardhat console (open new terminal):
```bash
cd blockchain
npx hardhat console --network localhost
```

Then run:
```javascript
// Get the contract
const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
const contract = CredentialRegistry.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

// Check authorized issuers
await contract.authorizedIssuers("0x0000000000000000000000000000000000000001"); // Dutch Bangla Bank
// Should return: true

// Get admin
await contract.admin();
// Should return the deployer address

// Exit
.exit
```

---

## Demo Script Status

### Current Demo Flow (10 Steps)

1. **Create Bank** ✅ - Creates or finds existing bank in MongoDB
2. **Register Customer** ✅ - Registers with NID number
3. **Submit KYC Request** ⚠️ - Rate limited after multiple runs
4. **Register Bank Officer** ✅ - Associates with created bank
5. **Login Bank Officer** ✅ - Tests authentication
6. **Get KYC Requests** ⚠️ - Returns 0 requests (needs investigation)
7. **Verify KYC Request** ❌ - Fails due to missing request
8. **Issue Blockchain Credential** ❌ - Fails due to missing request
9. **Retrieve Credentials** ✅ - Returns empty list (no credentials yet)
10. **Check Final KYC Status** ❌ - Fails due to missing request ID

### Current Issues

#### 1. Rate Limiting (Resolved with time)
**Issue:** KYC submission limited to 5 requests per hour per user

**Solution:**
- Wait 1 hour between test runs, OR
- Clear the rate limit cache, OR
- Use different customer emails/NIDs each time (already implemented)

#### 2. KYC Requests Not Showing for Bank Officer
**Issue:** Bank officer gets 0 KYC requests even though bank IDs match

**Possible Causes:**
- Status mismatch - KYC status is "submitted" but query might expect "pending"
- Bank association issue in KYC request
- Timing issue - KYC not fully saved before query

**Debug Info Added:**
- Script now prints bank IDs for verification
- Shows total requests count

#### 3. Empty Request ID
When KYC submission fails due to rate limit, `kycRequestId` remains empty, causing subsequent steps to fail.

**Solution:** Add early exit if KYC submission fails

### How to Run

**Prerequisites:**
```bash
# 1. Start Docker services
docker-compose up -d

# 2. Start Hardhat blockchain
cd blockchain && npm run node

# 3. Deploy smart contracts
cd blockchain && npm run deploy:local

# 4. Start backend server
cd backend && npm run dev
```

**Run Demo:**
```bash
# From project root
node scripts/demo-flow.js
```

### Expected Output (When Working)
```
╔════════════════════════════════════════════════════════════╗
║          eKYC Blockchain System - Demo Flow               ║
╚════════════════════════════════════════════════════════════╝

ℹ API Base URL: http://localhost:5000
ℹ API Version: v1
ℹ Start Time: 2024-11-23T...
ℹ Checking if backend server is running...
✓ Backend server is running

ℹ Connected to MongoDB

============================================================
Step 0: Create Bank
============================================================
ℹ Using existing bank
✓ Bank created successfully
...

============================================================
Demo Summary
============================================================
Successful Steps: 10/10 (100%)
✓ All steps completed successfully!
```

### Rate Limit Configuration

Current rate limits (from API):
- KYC Submission: 5 requests per hour
- General KYC routes: 100 requests per 15 minutes
- Bank routes: 200 requests per 15 minutes
- Credential issuance: 10 requests per hour

### Testing Without Rate Limits

To bypass rate limits for testing:

**Option 1: Disable Rate Limiter (Development Only)**
```javascript
// In backend/src/routes/kyc.routes.js
// Comment out the rate limiter:
// router.post('/submit', authorize('customer'), kycSubmitRateLimiter, submitKycRequest);
router.post('/submit', authorize('customer'), submitKycRequest);
```

**Option 2: Increase Rate Limits**
```env
# In backend/.env
RATE_LIMIT_WINDOW=1  # 1 minute instead of 15
RATE_LIMIT_MAX_REQUESTS=1000  # Much higher limit
```

**Option 3: Clear Redis Cache**
```bash
# If using Redis for rate limiting
docker exec ekyc_redis redis-cli -a eKYC_Redis_2025 FLUSHALL
```

---

## Key Features to Emphasize

### 1. Security
- Document hashes ensure tamper-proof verification
- Blockchain provides immutable audit trail
- Multi-level verification (phone, email, NID, address)
- Authorized issuers only (banks must be pre-approved)

### 2. Compliance
- AML/CFT screening support
- Risk assessment (low/medium/high/very_high)
- Regulatory compliance tracking
- Audit logs for all actions

### 3. Scalability
- MongoDB for flexible schema
- Redis for caching
- Docker containerization
- Blockchain for decentralized trust

### 4. Workflow Management
- Request submission
- Officer assignment
- Document verification
- Multi-stage approval process
- Status history tracking

### 5. Blockchain Integration
- Smart contract for credential registry
- Authorized issuer management
- Credential verification
- Revocation support
- Consent management (GDPR compliant)

---

## Talking Points

### Why Blockchain?
- **Immutability**: Once issued, credentials cannot be altered
- **Transparency**: All transactions are verifiable
- **Decentralization**: No single point of failure
- **Trust**: Banks can verify credentials without central authority
- **Interoperability**: Credentials can be shared across institutions

### Real-World Use Cases
1. **Cross-Bank Verification**: Customer verified by one bank, accepted by others
2. **Regulatory Compliance**: Auditors can verify KYC process on blockchain
3. **Customer Portability**: Customers own their credentials (self-sovereign identity)
4. **Fraud Prevention**: Duplicate accounts detected via blockchain records

### Technical Highlights

**Technologies Used:**
- **Blockchain:** Ethereum/Hardhat
- **Library:** ethers.js v6
- **Backend:** Node.js
- **Testing:** Jest
- **Smart Contracts:** Solidity

**Design Patterns:**
- Service-oriented architecture
- Manager pattern for separation of concerns
- Factory pattern for contract creation
- Observer pattern for event handling
- Error handling with custom exceptions

---

## Troubleshooting

### If Hardhat Node Fails:
```bash
# Kill existing process
pkill -f hardhat

# Restart
cd blockchain
npx hardhat node
```

### If MongoDB Connection Fails:
```bash
# Check Docker
docker-compose ps

# Restart if needed
docker-compose down
docker-compose up -d
```

### If Demo Data Already Exists:
The scripts are **idempotent** - they clean up existing demo data before creating new data.

### If mock demo fails:
- Make sure you're in the `backend` directory
- Check that Node.js is installed: `node --version`

### If live demo fails:
- That's okay! Use the mock demo instead
- The mock shows the exact same workflow
- Just mention "This simulates what happens on the blockchain"

---

## Quick Command Reference

```bash
# Stats
cd backend && ./show-stats.sh

# Mock Demo (always works)
cd backend && node demo-blockchain-mock.js

# Live Demo (needs hardhat node running)
cd backend && node demo-blockchain.js

# Show structure
tree backend/src/services/blockchain/ -L 2

# Show tests
ls -la backend/src/services/blockchain/__tests__/

# Run specific test
cd backend && npm test -- WalletManager.test.js

# Full demo sequence
./DEMO_TOMORROW.sh  # If available
```

---

## Success Rate

**Current:** 5-8/10 steps (50-80%) depending on rate limits

**Target:** 10/10 steps (100%)

**Blockers:**
- Rate limiting (temporary, clears after 1 hour)
- KYC request query (needs investigation)

---

## Quick Start Checklist

Before the demo:
- [ ] Docker containers running (`docker-compose ps`)
- [ ] Hardhat node running (`npx hardhat node`)
- [ ] Demo data populated (`node demo/01-populate-database.js`)
- [ ] Credential issued on blockchain (`node demo/02-issue-credential-blockchain.js`)
- [ ] MongoDB Express accessible (`http://localhost:8081`)
- [ ] Query script tested (`node demo/03-query-demo-data.js`)

---

Good luck with your presentation! 🚀
