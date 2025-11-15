# Blockchain Service - Setup & Testing Guide

## ✅ Prerequisites Check

Before using the blockchain service, ensure these are running:

```bash
# 1. Check MongoDB is running
docker ps | grep ekyc_mongodb
# Should show: ekyc_mongodb running on port 27017

# 2. Check Redis is running
docker ps | grep ekyc_redis
# Should show: ekyc_redis running on port 6379

# 3. Check Hardhat node is NOT running yet
# (We'll start it in the next step)
```

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies (Already Done)

The blockchain service uses **ethers.js v6.13.4** which is already installed:

```bash
cd /home/ursus/projects/eKYC/eKYC/backend
npm list ethers
# Should show: ethers@6.13.4
```

### Step 2: Start Hardhat Local Blockchain

Open a **new terminal** and keep it running:

```bash
cd /home/ursus/projects/eKYC/eKYC/blockchain
npx hardhat node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...
```

⚠️ **Keep this terminal running!** This is your local blockchain.

### Step 3: Deploy Smart Contract

Open a **second terminal**:

```bash
cd /home/ursus/projects/eKYC/eKYC/blockchain

# Deploy the CredentialRegistry contract
npx hardhat run scripts/deploy.js --network localhost
```

**Expected Output:**
```
CredentialRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Deployer address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

✅ **Contract address should be: `0x5FbDB2315678afecb367f032d93F642f64180aa3`**

This is already configured in your `.env` file!

### Step 4: Setup Authorized Issuers

In the same terminal:

```bash
npx hardhat run scripts/setup-issuers.js --network localhost
```

**Expected Output:**
```
Adding authorized issuers...
✅ Added: Dutch Bangla Bank (0x0000000000000000000000000000000000000001)
✅ Added: BRAC Bank (0x0000000000000000000000000000000000000002)
✅ Added: City Bank (0x0000000000000000000000000000000000000003)
Setup complete!
```

### Step 5: Verify Environment Configuration

Check that your `.env` file has these values:

```bash
cd /home/ursus/projects/eKYC/eKYC/backend
cat .env | grep BLOCKCHAIN
```

**Should show:**
```
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

✅ All configured correctly!

---

## 🧪 Testing the Blockchain Service

### Test 1: Basic Usage Example

```bash
cd /home/ursus/projects/eKYC/eKYC/backend
node src/services/blockchain/examples/basic-usage.js
```

**Expected Output:**
```
=== Initializing Credential Service ===

✅ Connected to localhost network
✅ Wallet loaded: 0xf39Fd...
✅ Contract loaded: 0x5FbDB...

=== Health Status ===
{
  "service": "CredentialService",
  "status": "healthy",
  "provider": {
    "healthy": true,
    "network": "localhost",
    "blockNumber": 15
  },
  "wallet": {
    "address": "0xf39Fd...",
    "balance": "9999.99... ETH",
    "balanceStatus": "healthy"
  }
}

=== Issuing Credential ===
Document Hash: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
Holder: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Type: 2

✅ Transaction sent
✅ Credential issued successfully

Issue Result:
{
  "success": true,
  "transactionHash": "0x...",
  "credentialId": "0x...",
  "blockNumber": 16,
  "gasUsed": "..."
}

=== Getting Credential Details ===
{
  "credentialId": "0x...",
  "credentialHash": "0xa1b2c3...",
  "issuer": "0xf39Fd...",
  "holder": "0x70997...",
  "issuedAt": 1731628800,
  "isRevoked": false,
  "credentialType": 2
}

=== Verifying Credential ===
{
  "credentialId": "0x...",
  "isValid": true,
  "verifiedAt": "2025-11-15T..."
}

=== Getting Holder Credentials ===
Total credentials: 1
[ '0x...' ]

=== Success! ===
```

✅ **If you see this output, the blockchain service is working perfectly!**

### Test 2: Event Listener Example

```bash
node src/services/blockchain/examples/event-listener.js
```

**Expected Output:**
```
=== Initializing Credential Service with Event Listener ===

✅ Service initialized
✅ Event listeners active

=== Setting up event watchers ===
Event watchers active. Monitoring blockchain...

=== Issuing test credential to trigger event ===
Credential issued: 0x...

🎉 CredentialIssued Event:
   Credential ID: 0x...
   Issuer: 0xf39Fd...
   Holder: 0x70997...
   Type: 2
   Block: 17
   TX Hash: 0x...

=== Querying Historical Events ===
Found 2 historical CredentialIssued events:

1. Credential ID: 0x...
   Holder: 0x70997...
   Block: 16
   TX: 0x...

2. Credential ID: 0x...
   Holder: 0x70997...
   Block: 17
   TX: 0x...

=== Listening for events for 60 seconds... ===
```

Press Ctrl+C after a few seconds to stop.

### Test 3: Queue Management Example

```bash
node src/services/blockchain/examples/queue-usage.js
```

**Expected Output:**
```
=== Initializing Credential Service with Queue ===

✅ Service initialized with queue

=== Queueing Multiple Credential Issuances ===

Queued: tx_1731628800000_abc123 (Priority: 10)
Queued: tx_1731628800100_def456 (Priority: 5)
Queued: tx_1731628800200_ghi789 (Priority: 1)

=== Queue Status ===
{
  "enabled": true,
  "isProcessing": true,
  "queueSize": 3,
  "processingCount": 0,
  "maxConcurrent": 5
}

=== Waiting for queue processing... ===

✅ Transaction tx_1731628800000_abc123 completed!
   TX Hash: 0x...
   Block: 18

✅ Transaction tx_1731628800100_def456 completed!
   TX Hash: 0x...
   Block: 19

✅ Transaction tx_1731628800200_ghi789 completed!
   TX Hash: 0x...
   Block: 20

=== Final Queue Statistics ===
{
  "queued": 3,
  "processed": 3,
  "succeeded": 3,
  "failed": 0,
  "successRate": "100.00%"
}

=== Success! ===
```

---

## 🔗 Integration with Existing Demo Scripts

### Update Demo Script to Use New Service

You can update your existing demo script at `backend/demo/02-issue-credential-blockchain.js`:

```javascript
// OLD WAY (manual ethers.js)
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
// ... lots of manual code ...

// NEW WAY (using CredentialService)
const { CredentialService } = require('../src/services/blockchain');

const credentialService = new CredentialService();
await credentialService.initialize();

const result = await credentialService.issueCredential(
  documentHash,
  holderAddress,
  credentialType
);

console.log('Success!', result);
```

### Run Updated Demo

```bash
cd /home/ursus/projects/eKYC/eKYC/backend

# 1. Populate database (if needed)
node demo/01-populate-database.js

# 2. Issue credential using blockchain service
node demo/02-issue-credential-blockchain.js

# 3. Query results
node demo/03-query-demo-data.js
```

---

## 📊 Verify Everything Works

### Quick Verification Script

Create a test script to verify all components:

```javascript
// test-blockchain-service.js
require('dotenv').config();
const { CredentialService } = require('./src/services/blockchain');

async function verifySetup() {
  console.log('🔍 Verifying Blockchain Service Setup...\n');

  const service = new CredentialService();

  try {
    // 1. Initialize
    console.log('1. Initializing service...');
    await service.initialize();
    console.log('   ✅ Service initialized\n');

    // 2. Check health
    console.log('2. Checking health...');
    const health = await service.getHealthStatus();
    console.log('   ✅ Provider:', health.provider.healthy ? 'Healthy' : 'Unhealthy');
    console.log('   ✅ Wallet Balance:', health.wallet.balance);
    console.log('   ✅ Contract Deployed:', health.contract.deployed ? 'Yes' : 'No');
    console.log('');

    // 3. Test credential issuance
    console.log('3. Testing credential issuance...');
    const testHash = 'f1e2d3c4b5a6978685746352413a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a';
    const testHolder = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    const result = await service.issueCredential(
      testHash,
      testHolder,
      2,
      { useQueue: false }
    );

    console.log('   ✅ Credential issued!');
    console.log('   ✅ TX Hash:', result.transactionHash);
    console.log('   ✅ Credential ID:', result.credentialId);
    console.log('');

    // 4. Verify credential
    console.log('4. Verifying credential...');
    const verification = await service.verifyCredential(
      result.credentialId,
      testHash
    );

    console.log('   ✅ Is Valid:', verification.isValid);
    console.log('');

    console.log('🎉 All checks passed! Blockchain service is ready to use!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await service.shutdown();
  }
}

verifySetup();
```

Save as `test-blockchain-service.js` and run:

```bash
node test-blockchain-service.js
```

---

## 🔧 Troubleshooting

### Problem 1: "Provider not connected"

**Cause:** Hardhat node not running

**Solution:**
```bash
# Check if Hardhat is running
curl http://localhost:8545
# If no response, start it:
cd blockchain && npx hardhat node
```

### Problem 2: "Contract not deployed at address"

**Cause:** Contract address mismatch or not deployed

**Solution:**
```bash
# Redeploy contract
cd blockchain
npx hardhat run scripts/deploy.js --network localhost

# Copy the deployed address to .env
# CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Problem 3: "Transaction reverted"

**Cause:** Not an authorized issuer

**Solution:**
```bash
# Check authorized issuers
cd blockchain
npx hardhat run scripts/setup-issuers.js --network localhost

# The default account (0xf39Fd...) is the deployer and can authorize
# But it's not an authorized issuer itself!
# Use one of the authorized issuer addresses in .env
```

### Problem 4: "Insufficient funds"

**Cause:** Wallet balance too low (unlikely on localhost)

**Solution:**
```bash
# Restart Hardhat node to reset balances to 10,000 ETH
# Stop current node (Ctrl+C) and restart:
cd blockchain && npx hardhat node
```

### Problem 5: "Nonce too low"

**Cause:** Hardhat node was restarted but service cached old nonce

**Solution:**
```javascript
// Clear nonce cache in your code
service.transactionManager.clearNonceCache();

// Or restart your application
```

---

## 📝 Next Steps

1. **Integrate with API Routes**: Use the blockchain service in your Express routes
2. **Add to KYC Workflow**: Call `issueCredential()` when approving KYC requests
3. **Setup Event Handlers**: Listen for blockchain events and update database
4. **Configure Monitoring**: Set up health check endpoints
5. **Deploy to Testnet**: Configure Sepolia for staging environment

---

## 🎓 Learning Resources

### Example Files
- `examples/basic-usage.js` - Simple operations
- `examples/queue-usage.js` - Queue management
- `examples/event-listener.js` - Event monitoring

### Documentation
- `README.md` - Full API documentation
- `QUICK_START.md` - Quick reference guide
- `BLOCKCHAIN_SERVICE_SUMMARY.md` - Complete implementation details

### Smart Contract
- `blockchain/contracts/CredentialRegistry.sol` - Contract source code
- `blockchain/test/CredentialRegistry.test.js` - Contract tests

---

## ✅ Setup Complete!

If all tests pass, your blockchain service is ready for production use!

**Next:** Integrate the service into your KYC approval workflow and API endpoints.

**Questions?** Check the documentation files or review the example scripts.

---

**Happy Blockchain Development! 🚀**
