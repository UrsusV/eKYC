# Blockchain Service - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Prerequisites

Ensure you have:
- ✅ MongoDB running (port 27017)
- ✅ Redis running (port 6379)
- ✅ Hardhat node running (port 8545)
- ✅ Smart contract deployed

### 2. Start Hardhat Node

```bash
cd /home/ursus/projects/eKYC/eKYC/blockchain
npx hardhat node
```

Keep this terminal running.

### 3. Deploy Smart Contract (if needed)

In a new terminal:

```bash
cd /home/ursus/projects/eKYC/eKYC/blockchain
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/setup-issuers.js --network localhost
```

### 4. Update Environment Variables

The `.env` file should already be configured with:

```bash
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_RPC_URL=http://localhost:8545
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 5. Run Basic Example

```bash
cd /home/ursus/projects/eKYC/eKYC/backend
node src/services/blockchain/examples/basic-usage.js
```

Expected output:
```
=== Initializing Credential Service ===
✅ Connected to localhost network
✅ Wallet loaded
✅ Contract loaded

=== Health Status ===
{
  "service": "CredentialService",
  "status": "healthy",
  "provider": { "healthy": true, "blockNumber": 123 },
  "wallet": { "balance": "10000.0 ETH" }
}

=== Issuing Credential ===
✅ Transaction sent: 0x1234...
✅ Credential issued: 0xabcd...

=== Success! ===
```

## 📋 Common Operations

### Issue a Credential

```javascript
const { CredentialService } = require('./services/blockchain');

const service = new CredentialService();
await service.initialize();

const result = await service.issueCredential(
  'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', // SHA-256 hash
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',  // Holder address
  2,  // Credential type (2 = KYC)
  { useQueue: false }
);

console.log('TX Hash:', result.transactionHash);
console.log('Credential ID:', result.credentialId);
```

### Verify a Credential

```javascript
const verification = await service.verifyCredential(
  credentialId,
  documentHash
);

console.log('Is Valid:', verification.isValid);
```

### Get Credential Details

```javascript
const credential = await service.getCredential(credentialId);

console.log('Issuer:', credential.issuer);
console.log('Holder:', credential.holder);
console.log('Issued At:', new Date(credential.issuedAt * 1000));
console.log('Is Revoked:', credential.isRevoked);
```

### Revoke a Credential

```javascript
const result = await service.revokeCredential(
  credentialId,
  { useQueue: false }
);

console.log('Revoked:', result.transactionHash);
```

## 🎯 Integration with KYC Workflow

### Complete KYC Issuance Flow

```javascript
const { CredentialService } = require('./services/blockchain');
const KycRequest = require('./models/KycRequest');
const Document = require('./models/Document');

async function issueKycCredential(kycRequestId) {
  // 1. Get KYC request from database
  const kycRequest = await KycRequest.findById(kycRequestId)
    .populate('userId')
    .populate('documents');

  // 2. Find the verified document
  const verifiedDoc = kycRequest.documents.find(
    doc => doc.type === 'nid_front' && doc.verificationStatus === 'verified'
  );

  if (!verifiedDoc) {
    throw new Error('No verified document found');
  }

  // 3. Initialize blockchain service
  const credentialService = new CredentialService();
  await credentialService.initialize();

  try {
    // 4. Issue credential on blockchain
    const result = await credentialService.issueCredential(
      verifiedDoc.hash,                    // Document hash
      kycRequest.userId.walletAddress,     // Holder address
      2,                                   // KYC type
      {
        useQueue: false,
        metadata: {
          kycRequestId: kycRequest._id.toString(),
          userId: kycRequest.userId._id.toString(),
          documentId: verifiedDoc._id.toString(),
        }
      }
    );

    // 5. Update KYC request with blockchain data
    kycRequest.blockchain.transactionHash = result.transactionHash;
    kycRequest.blockchain.blockNumber = result.blockNumber;
    kycRequest.blockchain.credentialHash = '0x' + verifiedDoc.hash;
    kycRequest.blockchain.issuedOnChain = true;
    kycRequest.status = 'approved';

    await kycRequest.save();

    // 6. Update user KYC status
    kycRequest.userId.kycStatus = 'approved';
    await kycRequest.userId.save();

    console.log('✅ KYC credential issued on blockchain');
    console.log('   Transaction:', result.transactionHash);
    console.log('   Credential ID:', result.credentialId);

    return result;

  } finally {
    await credentialService.shutdown();
  }
}

// Usage
issueKycCredential('65f1a2b3c4d5e6f7a8b9c0d1');
```

## 🔄 Using Transaction Queue

For high-volume operations, use the transaction queue:

```javascript
const service = new CredentialService({
  enableQueue: true,
  enableEventListener: true,
});

await service.initialize();

// Queue multiple credentials
const txIds = [];

for (const kycRequest of kycRequests) {
  const result = await service.issueCredential(
    kycRequest.documentHash,
    kycRequest.holderAddress,
    2,
    {
      useQueue: true,
      priority: QUEUE.PRIORITIES.HIGH,
      metadata: { kycRequestId: kycRequest._id }
    }
  );

  txIds.push(result.txId);
}

// Check queue status
const status = service.getQueueStatus();
console.log('Queue:', status.queueSize);
console.log('Processing:', status.processingCount);

// Monitor specific transaction
const txStatus = service.getTransactionStatus(txIds[0]);
console.log('Status:', txStatus.status);
```

## 📊 Monitoring & Health Checks

### Service Health Check

```javascript
const health = await service.getHealthStatus();

console.log('Service:', health.status);
console.log('Blockchain:', health.provider.healthy);
console.log('Wallet Balance:', health.wallet.balance);
console.log('Contract Deployed:', health.contract.deployed);

if (health.queue) {
  console.log('Queue Size:', health.queue.queueSize);
  console.log('Processing:', health.queue.processingCount);
}
```

### Check Wallet Balance

```javascript
const { CredentialService } = require('./services/blockchain');

const service = new CredentialService();
await service.initialize();

const walletInfo = await service.walletManager.getWalletInfo();

console.log('Address:', walletInfo.address);
console.log('Balance:', walletInfo.balanceEth, 'ETH');
console.log('Status:', walletInfo.balanceStatus);

if (walletInfo.balanceStatus === 'critical') {
  console.error('⚠️  CRITICAL: Wallet balance too low!');
  // Send alert, stop operations, etc.
}
```

## 🎧 Event Listening

### Listen to Blockchain Events

```javascript
const service = new CredentialService({
  enableEventListener: true,
});

await service.initialize();

// Watch for credential issuance
const unwatch = service.watchCredentialEvents(
  'CredentialIssued',
  async (eventData) => {
    console.log('New credential issued!');
    console.log('Credential ID:', eventData.args.credentialId);
    console.log('Holder:', eventData.args.holder);

    // Update database
    await KycRequest.findOneAndUpdate(
      { 'blockchain.credentialHash': eventData.args.credentialHash },
      {
        'blockchain.credentialId': eventData.args.credentialId,
        'blockchain.confirmedAt': new Date(),
      }
    );
  }
);

// Stop watching when done
// unwatch();
```

## 🐛 Troubleshooting

### Problem: "Provider not connected"

**Solution:**
```bash
# Check if Hardhat node is running
curl http://localhost:8545

# Start Hardhat node
cd blockchain && npx hardhat node
```

### Problem: "Contract not deployed"

**Solution:**
```bash
# Deploy contract
cd blockchain
npx hardhat run scripts/deploy.js --network localhost

# Update CONTRACT_ADDRESS in .env
```

### Problem: "Insufficient funds"

**Solution:**
```javascript
// Check wallet balance
const balance = await service.walletManager.getBalance();
console.log('Balance:', BlockchainHelpers.weiToEth(balance), 'ETH');

// For Hardhat, the default account has 10,000 ETH
// If balance is low, restart Hardhat node
```

### Problem: Transaction stuck/pending

**Solution:**
```javascript
// Check transaction status
const txStatus = await service.transactionManager.getTransactionStatus(txHash);
console.log('Status:', txStatus);

// Clear nonce cache
service.transactionManager.clearNonceCache();

// Retry transaction
```

## 📚 Next Steps

1. **Read the full README**: [README.md](./README.md)
2. **Explore examples**: Check `examples/` folder
3. **Review API docs**: See API Reference in README
4. **Test on testnet**: Deploy to Sepolia for staging
5. **Integrate with API**: Add to Express routes

## 🔐 Security Checklist

- [ ] Never commit private keys to version control
- [ ] Use environment variables for sensitive data
- [ ] Monitor wallet balance regularly
- [ ] Test on localhost/testnet before mainnet
- [ ] Set up alerts for low balance
- [ ] Implement rate limiting for blockchain calls
- [ ] Log all blockchain operations for audit

## 📞 Need Help?

- Check error logs for detailed information
- Review blockchain explorer for transaction details
- Ensure all services (MongoDB, Redis, Hardhat) are running
- Verify environment variables are set correctly
- Check example scripts for reference implementations

---

**Happy Blockchain Development! 🎉**
