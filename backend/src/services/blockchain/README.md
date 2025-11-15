# Blockchain Service Layer

A comprehensive blockchain service layer for the eKYC system using ethers.js v6. This service manages all interactions with the CredentialRegistry smart contract on Ethereum (Hardhat local or Sepolia testnet).

## Features

- ✅ **Network Management**: Connect to Hardhat local network or Sepolia testnet
- ✅ **Wallet Management**: Secure wallet operations with balance monitoring
- ✅ **Smart Contract Interaction**: Type-safe contract calls with automatic ABI loading
- ✅ **Gas Estimation**: Automatic gas estimation with configurable buffers
- ✅ **Transaction Retry**: Exponential backoff retry logic for failed transactions
- ✅ **Event Listening**: Real-time blockchain event monitoring
- ✅ **Transaction Queue**: Priority-based transaction queue with concurrency control
- ✅ **Comprehensive Logging**: Structured logging with different levels
- ✅ **Error Handling**: Custom error types for different failure scenarios

## Architecture

```
blockchain/
├── core/
│   └── BlockchainProvider.js      # Network connection management
├── managers/
│   ├── WalletManager.js           # Wallet operations
│   ├── ContractManager.js         # Smart contract interactions
│   ├── TransactionManager.js      # Transaction execution with retry
│   ├── EventListener.js           # Event monitoring
│   └── TransactionQueue.js        # Transaction queue management
├── utils/
│   ├── errors.js                  # Custom error classes
│   ├── logger.js                  # Logging utilities
│   ├── validators.js              # Input validation
│   ├── helpers.js                 # Helper functions
│   └── constants.js               # Configuration constants
├── examples/
│   ├── basic-usage.js             # Basic usage example
│   ├── queue-usage.js             # Queue management example
│   └── event-listener.js          # Event listening example
├── CredentialService.js           # Main service (high-level API)
├── index.js                       # Module exports
└── README.md                      # This file
```

## Installation

The service is already integrated into the eKYC backend. No additional installation required.

## Configuration

Configure via environment variables in `.env`:

```bash
# Network selection (localhost, sepolia, mainnet)
BLOCKCHAIN_NETWORK=localhost

# RPC URLs
BLOCKCHAIN_RPC_URL=http://localhost:8545
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY

# Contract addresses
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
SEPOLIA_CONTRACT_ADDRESS=
MAINNET_CONTRACT_ADDRESS=

# Wallet private key (WARNING: Never commit this!)
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Gas configuration
GAS_LIMIT=3000000
```

## Usage

### Basic Usage

```javascript
const { CredentialService } = require('./services/blockchain');

async function main() {
  const credentialService = new CredentialService();

  // Initialize the service
  await credentialService.initialize();

  // Issue a credential
  const result = await credentialService.issueCredential(
    documentHash,     // SHA-256 hash (64 hex chars)
    holderAddress,    // Ethereum address
    credentialType,   // 1 = Student ID, 2 = KYC
    { useQueue: false } // Execute immediately
  );

  console.log('Transaction Hash:', result.transactionHash);
  console.log('Credential ID:', result.credentialId);

  // Verify the credential
  const verification = await credentialService.verifyCredential(
    result.credentialId,
    documentHash
  );

  console.log('Is Valid:', verification.isValid);

  // Shutdown
  await credentialService.shutdown();
}
```

### Using Transaction Queue

```javascript
const { CredentialService, QUEUE } = require('./services/blockchain');

async function main() {
  const credentialService = new CredentialService({
    enableQueue: true,
    enableEventListener: true,
  });

  await credentialService.initialize();

  // Queue a high-priority transaction
  const result = await credentialService.issueCredential(
    documentHash,
    holderAddress,
    2, // KYC
    {
      useQueue: true,
      priority: QUEUE.PRIORITIES.HIGH,
      metadata: { userId: '123', kycRequestId: '456' }
    }
  );

  console.log('Queued Transaction ID:', result.txId);

  // Check queue status
  const queueStatus = credentialService.getQueueStatus();
  console.log('Queue Size:', queueStatus.queueSize);
  console.log('Processing:', queueStatus.processingCount);

  // Check specific transaction status
  const txStatus = credentialService.getTransactionStatus(result.txId);
  console.log('Status:', txStatus.status);
}
```

### Event Listening

```javascript
const { CredentialService } = require('./services/blockchain');

async function main() {
  const credentialService = new CredentialService({
    enableEventListener: true,
  });

  await credentialService.initialize();

  // Watch for CredentialIssued events
  const unwatch = credentialService.watchCredentialEvents(
    'CredentialIssued',
    (eventData) => {
      console.log('New credential issued!');
      console.log('Credential ID:', eventData.args.credentialId);
      console.log('Holder:', eventData.args.holder);
      console.log('Block:', eventData.blockNumber);
    }
  );

  // Query historical events
  const events = await credentialService.queryCredentialEvents(
    'CredentialIssued',
    0,
    'latest'
  );

  console.log(`Found ${events.length} historical events`);

  // Stop watching
  unwatch();
}
```

### Advanced: Custom Configuration

```javascript
const {
  BlockchainProvider,
  WalletManager,
  ContractManager,
  TransactionManager,
} = require('./services/blockchain');

async function main() {
  // 1. Initialize provider
  const provider = new BlockchainProvider('sepolia');
  await provider.connect();

  // 2. Setup wallet
  const walletManager = new WalletManager(provider);
  walletManager.loadFromPrivateKey(process.env.BLOCKCHAIN_PRIVATE_KEY);

  // Check balance
  const balance = await walletManager.getBalance();
  console.log('Balance:', BlockchainHelpers.weiToEth(balance), 'ETH');

  // 3. Load contract
  const contractManager = new ContractManager(provider, walletManager);
  await contractManager.loadContractFromArtifact(
    './blockchain/artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json',
    process.env.SEPOLIA_CONTRACT_ADDRESS,
    'credentialRegistry'
  );

  // 4. Execute transactions
  const txManager = new TransactionManager(provider, walletManager, contractManager);

  const { tx, receipt } = await txManager.executeContractMethod(
    'credentialRegistry',
    'issueCredential',
    [credentialHash, holderAddress, 2],
    {
      priorityLevel: 'high',
      confirmations: 2,
    }
  );

  console.log('Transaction:', tx.hash);
  console.log('Block:', receipt.blockNumber);
}
```

## API Reference

### CredentialService

#### `initialize()`
Initialize the service and connect to blockchain.

#### `shutdown()`
Gracefully shutdown the service.

#### `issueCredential(credentialHash, holderAddress, credentialType, options)`
Issue a new credential on blockchain.

**Parameters:**
- `credentialHash` (string): SHA-256 hash (64 hex chars, no 0x prefix)
- `holderAddress` (string): Ethereum address
- `credentialType` (number): 1 = Student ID, 2 = KYC
- `options` (object):
  - `useQueue` (boolean): Use transaction queue (default: true if enabled)
  - `priority` (number): Queue priority (see QUEUE.PRIORITIES)
  - `metadata` (object): Additional metadata

**Returns:** Object with `transactionHash`, `credentialId`, `blockNumber` or `txId` if queued.

#### `verifyCredential(credentialId, documentHash)`
Verify a credential on blockchain.

**Parameters:**
- `credentialId` (string): Credential ID (bytes32)
- `documentHash` (string): SHA-256 hash to verify

**Returns:** Object with `isValid` boolean.

#### `getCredential(credentialId)`
Get credential details from blockchain.

**Parameters:**
- `credentialId` (string): Credential ID (bytes32)

**Returns:** Credential object with all details.

#### `getHolderCredentials(holderAddress)`
Get all credentials for a holder.

**Parameters:**
- `holderAddress` (string): Ethereum address

**Returns:** Array of credential IDs.

#### `revokeCredential(credentialId, options)`
Revoke a credential.

**Parameters:**
- `credentialId` (string): Credential ID to revoke
- `options` (object): Same as issueCredential

**Returns:** Transaction result or queue ID.

#### `grantConsent(verifierAddress, credentialId, options)`
Grant access consent to a verifier.

**Parameters:**
- `verifierAddress` (string): Verifier's Ethereum address
- `credentialId` (string): Credential ID
- `options` (object): Same as issueCredential

**Returns:** Transaction result or queue ID.

#### `getHealthStatus()`
Get service health status.

**Returns:** Object with service health information.

### Constants

#### CREDENTIAL_TYPES
```javascript
{
  STUDENT_ID: 1,
  KYC: 2
}
```

#### QUEUE.PRIORITIES
```javascript
{
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  CRITICAL: 20
}
```

#### TX_STATUS
```javascript
{
  PENDING: 'pending',
  QUEUED: 'queued',
  MINING: 'mining',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  REPLACED: 'replaced',
  CANCELLED: 'cancelled'
}
```

## Error Handling

The service uses custom error classes:

```javascript
const {
  BlockchainError,
  NetworkError,
  ConnectionError,
  ContractError,
  TransactionError,
  GasEstimationError,
  WalletError,
  EventListenerError,
  QueueError,
  ValidationError,
  TimeoutError,
  InsufficientFundsError,
  NonceError,
  RevertError,
} = require('./services/blockchain/utils/errors');

try {
  await credentialService.issueCredential(...);
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    console.error('Wallet balance too low:', error.details);
  } else if (error instanceof ContractError) {
    console.error('Contract error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Logging

The service includes comprehensive logging:

```javascript
const { createLogger } = require('./services/blockchain/utils/logger');

const logger = createLogger('MyService');

logger.info('Information message');
logger.error('Error message', error);
logger.success('Success message');
logger.debug('Debug message');
logger.warn('Warning message');

// Specialized logging
logger.transaction(txHash, 'sent');
logger.gas('operation', gasUsed, gasLimit);
logger.event('CredentialIssued', contractAddress, eventData);
```

## Testing

Run the example scripts:

```bash
# Basic usage
node src/services/blockchain/examples/basic-usage.js

# Queue management
node src/services/blockchain/examples/queue-usage.js

# Event listening
node src/services/blockchain/examples/event-listener.js
```

## Gas Optimization

The service includes automatic gas optimization:

- **Gas Estimation**: Automatically estimates gas with 20% buffer
- **EIP-1559 Support**: Uses maxFeePerGas and maxPriorityFeePerGas on supported networks
- **Priority Levels**: Choose between slow, standard, fast, and urgent
- **Gas Limits**: Pre-configured limits for common operations
- **Safety Limits**: Maximum gas price protection

## Security Considerations

1. **Private Key Storage**: Never commit private keys to version control
2. **Environment Variables**: Use `.env` file for sensitive data
3. **Wallet Balance**: Monitor wallet balance to prevent transaction failures
4. **Network Selection**: Use localhost for development, testnets for staging
5. **Gas Limits**: Set reasonable gas limits to prevent overspending
6. **Input Validation**: All inputs are validated before blockchain submission

## Monitoring

### Health Checks

```javascript
const health = await credentialService.getHealthStatus();

console.log('Provider:', health.provider.healthy);
console.log('Wallet Balance:', health.wallet.balance);
console.log('Contract Deployed:', health.contract.deployed);
console.log('Queue Size:', health.queue?.queueSize);
```

### Transaction Tracking

```javascript
// Get pending transactions
const pending = transactionManager.getPendingTransactions();

// Clear completed transactions
const cleared = transactionManager.clearCompletedTransactions();

// Get queue statistics
const stats = transactionQueue.getStatistics();
console.log('Success Rate:', stats.successRate);
console.log('Failure Rate:', stats.failureRate);
```

## Best Practices

1. **Initialize Once**: Create a singleton instance of CredentialService
2. **Use Queue**: Enable queue for production to handle transaction bursts
3. **Monitor Events**: Use event listeners to track credential lifecycle
4. **Handle Errors**: Always wrap blockchain calls in try-catch blocks
5. **Check Balance**: Monitor wallet balance and set up alerts
6. **Log Everything**: Use structured logging for debugging
7. **Test First**: Test on localhost/testnet before mainnet deployment
8. **Graceful Shutdown**: Always call shutdown() before exiting

## Troubleshooting

### Connection Issues
```javascript
// Check network connection
const health = await provider.healthCheck();
if (!health.healthy) {
  console.error('Provider not healthy:', health.error);
}
```

### Transaction Failures
```javascript
// Enable debug logging
process.env.DEBUG = 'true';

// Check gas estimation
const gasEstimate = await transactionManager.estimateGas(transaction);
console.log('Estimated gas:', gasEstimate.toString());

// Check wallet balance
const balance = await walletManager.getBalance();
console.log('Balance:', BlockchainHelpers.weiToEth(balance), 'ETH');
```

### Event Listening Issues
```javascript
// Check event listener status
const status = eventListener.getStatus();
console.log('Is Listening:', status.isListening);
console.log('Listener Count:', status.listenerCount);
console.log('Last Processed Blocks:', status.lastProcessedBlocks);
```

## Contributing

When adding new features:

1. Add comprehensive error handling
2. Include logging at appropriate levels
3. Validate all inputs
4. Add TypeScript-style JSDoc comments
5. Update this README
6. Create example usage in `examples/`

## License

This blockchain service is part of the eKYC system.

## Support

For issues or questions:
- Check the examples in `examples/`
- Review error logs for detailed error information
- Check blockchain explorer for transaction details
- Ensure Hardhat node is running for local development
