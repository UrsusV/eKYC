# eKYC Demo Scripts 🎯

Quick reference for running the demo presentation.

## Prerequisites

1. **Docker containers running:**
   ```bash
   docker-compose ps
   # Should show: MongoDB, Redis, Mongo Express, Redis Commander
   ```

2. **Hardhat node running (separate terminal):**
   ```bash
   cd ../../blockchain
   npx hardhat node
   # Keep this running!
   ```

## Demo Scripts (Run in Order)

### 1. Populate Database (5 min)
```bash
node demo/01-populate-database.js
```

**Creates:**
- 2 Banks (Dutch Bangla Bank, BRAC Bank)
- 1 Bank Officer
- 2 Customers
- 1 Submitted KYC Request
- 1 Verified Document

### 2. Issue Blockchain Credential (7 min)
```bash
node demo/02-issue-credential-blockchain.js
```

**Does:**
- Finds submitted KYC request
- Issues credential on blockchain smart contract
- Updates database with transaction hash
- Approves KYC request
- Updates customer status

### 3. View All Data (3 min)
```bash
node demo/03-query-demo-data.js
```

**Shows:**
- Complete system report
- All users, banks, requests, documents
- Blockchain transaction details
- System statistics

## Web Interfaces

- **MongoDB Express:** http://localhost:8081
  - Username: `admin`
  - Password: `admin123`

- **Redis Commander:** http://localhost:8082

## Troubleshooting

### If Hardhat connection fails:
```bash
# In blockchain directory
pkill -f hardhat
npx hardhat node
```

### If data already exists:
Scripts are idempotent - they clean up existing demo data before creating new data.

### If MongoDB connection fails:
```bash
docker-compose restart mongodb
```

## Login Credentials

- **Customer Account:**
  - Email: `rahim@demo-customer.com`
  - Password: `Demo@123456`

- **Bank Officer Account:**
  - Email: `officer1@demo.dbbl.com`
  - Password: `Demo@123456`

## Key Demo Points

1. **Multi-layer verification** (phone, email, NID, address)
2. **Cryptographic hashes** for document integrity
3. **Blockchain immutability** for credentials
4. **Workflow management** (draft → submitted → approved)
5. **Bank authorization** on smart contract
6. **Tamper-proof audit trail**

## Full Demo Guide

See `../DEMO_GUIDE.md` for comprehensive presentation instructions.

---

**Good luck with your presentation!** 🚀
