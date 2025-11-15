/**
 * Blockchain Service Constants
 */

module.exports = {
  // Network configurations
  NETWORKS: {
    LOCALHOST: {
      name: 'localhost',
      chainId: 31337,
      rpcUrl: 'http://127.0.0.1:8545',
      blockTime: 2, // seconds
      confirmations: 1,
    },
    SEPOLIA: {
      name: 'sepolia',
      chainId: 11155111,
      rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/',
      blockTime: 12, // seconds
      confirmations: 2,
    },
    MAINNET: {
      name: 'mainnet',
      chainId: 1,
      rpcUrl: process.env.MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/',
      blockTime: 12, // seconds
      confirmations: 3,
    },
  },

  // Credential types
  CREDENTIAL_TYPES: {
    STUDENT_ID: 1,
    KYC: 2,
  },

  // Transaction statuses
  TX_STATUS: {
    PENDING: 'pending',
    QUEUED: 'queued',
    MINING: 'mining',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    REPLACED: 'replaced',
    CANCELLED: 'cancelled',
  },

  // Gas configuration
  GAS: {
    // Gas limits for different operations
    LIMITS: {
      ISSUE_CREDENTIAL: 200000,
      REVOKE_CREDENTIAL: 100000,
      GRANT_CONSENT: 80000,
      VERIFY_CREDENTIAL: 50000,
      ADD_ISSUER: 100000,
      TRANSFER: 21000,
    },

    // Gas price multipliers (for different priority levels)
    PRICE_MULTIPLIERS: {
      SLOW: 1.0,
      STANDARD: 1.2,
      FAST: 1.5,
      URGENT: 2.0,
    },

    // Maximum gas price (in Gwei) - safety limit
    MAX_GAS_PRICE_GWEI: 500,

    // Gas estimation buffer (add 20% to estimated gas)
    ESTIMATION_BUFFER: 1.2,

    // EIP-1559 settings
    EIP1559: {
      // Max priority fee per gas (tip to miners) in Gwei
      DEFAULT_PRIORITY_FEE_GWEI: 2,
      // Max fee per gas multiplier over base fee
      MAX_FEE_MULTIPLIER: 2,
    },
  },

  // Transaction retry configuration
  RETRY: {
    // Maximum number of retry attempts
    MAX_ATTEMPTS: 3,

    // Retry delay in milliseconds (exponential backoff)
    INITIAL_DELAY: 1000,
    MAX_DELAY: 30000,
    BACKOFF_MULTIPLIER: 2,

    // Timeout for transaction confirmation (in milliseconds)
    CONFIRMATION_TIMEOUT: 300000, // 5 minutes

    // When to retry (error codes)
    RETRYABLE_ERRORS: [
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVER_ERROR',
      'NONCE_EXPIRED',
      'REPLACEMENT_UNDERPRICED',
    ],
  },

  // Event listener configuration
  EVENTS: {
    // Events to listen to
    CREDENTIAL_ISSUED: 'CredentialIssued',
    CREDENTIAL_REVOKED: 'CredentialRevoked',
    CONSENT_GRANTED: 'ConsentGranted',
    ISSUER_AUTHORIZED: 'IssuerAuthorized',

    // Polling interval for events (in milliseconds)
    POLLING_INTERVAL: 5000,

    // How many blocks to look back for events
    LOOKBACK_BLOCKS: 1000,

    // Event processing batch size
    BATCH_SIZE: 100,
  },

  // Transaction queue configuration
  QUEUE: {
    // Maximum queue size
    MAX_SIZE: 1000,

    // Processing interval (in milliseconds)
    PROCESS_INTERVAL: 2000,

    // Maximum concurrent transactions
    MAX_CONCURRENT: 5,

    // Queue priorities
    PRIORITIES: {
      LOW: 1,
      NORMAL: 5,
      HIGH: 10,
      CRITICAL: 20,
    },

    // Transaction TTL (time to live) in milliseconds
    TTL: 3600000, // 1 hour
  },

  // Wallet configuration
  WALLET: {
    // Minimum balance warning threshold (in ETH)
    MIN_BALANCE_WARNING: 0.1,

    // Critical balance threshold (in ETH)
    MIN_BALANCE_CRITICAL: 0.01,

    // Default derivation path for HD wallets
    DERIVATION_PATH: "m/44'/60'/0'/0",
  },

  // Contract interaction timeouts
  TIMEOUTS: {
    // RPC call timeout
    RPC_CALL: 30000,

    // Transaction submission timeout
    TX_SUBMIT: 60000,

    // Block confirmation timeout
    CONFIRMATION: 300000,

    // Event listener timeout
    EVENT_LISTENER: 10000,
  },

  // Error codes
  ERROR_CODES: {
    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    CONNECTION_ERROR: 'CONNECTION_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',

    // Transaction errors
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    NONCE_ERROR: 'NONCE_ERROR',
    GAS_ESTIMATION_ERROR: 'GAS_ESTIMATION_ERROR',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',
    REVERT_ERROR: 'REVERT_ERROR',

    // Contract errors
    CONTRACT_NOT_DEPLOYED: 'CONTRACT_NOT_DEPLOYED',
    INVALID_CONTRACT_ADDRESS: 'INVALID_CONTRACT_ADDRESS',
    METHOD_NOT_FOUND: 'METHOD_NOT_FOUND',

    // Validation errors
    INVALID_ADDRESS: 'INVALID_ADDRESS',
    INVALID_HASH: 'INVALID_HASH',
    INVALID_CREDENTIAL_TYPE: 'INVALID_CREDENTIAL_TYPE',

    // Authorization errors
    UNAUTHORIZED_ISSUER: 'UNAUTHORIZED_ISSUER',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

    // Queue errors
    QUEUE_FULL: 'QUEUE_FULL',
    DUPLICATE_TRANSACTION: 'DUPLICATE_TRANSACTION',
  },

  // Logging levels
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    SUCCESS: 'success',
  },

  // Cache TTLs (in seconds)
  CACHE_TTL: {
    BLOCK_NUMBER: 5,
    GAS_PRICE: 10,
    NETWORK_INFO: 60,
    CONTRACT_DATA: 300,
    CREDENTIAL_STATUS: 30,
  },

  // Monitoring thresholds
  MONITORING: {
    // Alert if transaction pending for more than (in milliseconds)
    PENDING_TX_ALERT: 120000, // 2 minutes

    // Alert if gas price exceeds (in Gwei)
    GAS_PRICE_ALERT: 200,

    // Alert if wallet balance below (in ETH)
    BALANCE_ALERT: 0.05,

    // Alert if transaction failure rate exceeds (percentage)
    FAILURE_RATE_ALERT: 10,
  },

  // Rate limiting
  RATE_LIMITS: {
    // Maximum requests per second to RPC endpoint
    RPC_REQUESTS_PER_SECOND: 10,

    // Maximum transactions per minute
    TRANSACTIONS_PER_MINUTE: 20,

    // Maximum event queries per minute
    EVENT_QUERIES_PER_MINUTE: 30,
  },
};
