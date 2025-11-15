/**
 * Credential Service
 * High-level service for KYC credential operations on blockchain
 */

const path = require('path');
const { createLogger } = require('./utils/logger');
const { ContractError, ValidationError } = require('./utils/errors');
const { CREDENTIAL_TYPES, QUEUE } = require('./utils/constants');
const BlockchainValidator = require('./utils/validators');
const BlockchainHelpers = require('./utils/helpers');

// Core managers
const BlockchainProvider = require('./core/BlockchainProvider');
const WalletManager = require('./managers/WalletManager');
const ContractManager = require('./managers/ContractManager');
const TransactionManager = require('./managers/TransactionManager');
const EventListener = require('./managers/EventListener');
const TransactionQueue = require('./managers/TransactionQueue');

class CredentialService {
  constructor(config = {}) {
    this.logger = createLogger('CredentialService');
    this.config = {
      network: config.network || process.env.BLOCKCHAIN_NETWORK || 'localhost',
      contractAddress: config.contractAddress || process.env.CONTRACT_ADDRESS,
      privateKey: config.privateKey || process.env.BLOCKCHAIN_PRIVATE_KEY,
      artifactPath: config.artifactPath || path.join(
        __dirname,
        '../../../blockchain/artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json'
      ),
      enableQueue: config.enableQueue !== false,
      enableEventListener: config.enableEventListener !== false,
    };

    // Initialize components
    this.provider = null;
    this.walletManager = null;
    this.contractManager = null;
    this.transactionManager = null;
    this.eventListener = null;
    this.transactionQueue = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the credential service
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        this.logger.warn('Credential service is already initialized');
        return;
      }

      this.logger.info('Initializing Credential Service', {
        network: this.config.network,
        contractAddress: this.config.contractAddress,
      });

      // 1. Initialize provider
      this.provider = new BlockchainProvider(this.config.network);
      await this.provider.connect();

      // 2. Initialize wallet manager
      this.walletManager = new WalletManager(this.provider);

      if (!this.config.privateKey) {
        throw new Error('BLOCKCHAIN_PRIVATE_KEY not configured in environment');
      }

      this.walletManager.loadFromPrivateKey(this.config.privateKey);

      // Check wallet balance
      const balanceStatus = await this.walletManager.checkBalanceStatus();
      if (balanceStatus.status === 'critical') {
        this.logger.error('Wallet balance is critically low!', null, balanceStatus);
      }

      // 3. Initialize contract manager
      this.contractManager = new ContractManager(this.provider, this.walletManager);

      if (!this.config.contractAddress) {
        throw new Error('CONTRACT_ADDRESS not configured in environment');
      }

      await this.contractManager.loadContractFromArtifact(
        this.config.artifactPath,
        this.config.contractAddress,
        'credentialRegistry'
      );

      // Verify contract is deployed
      const isDeployed = await this.contractManager.isDeployed('credentialRegistry');
      if (!isDeployed) {
        throw new Error(`Contract not deployed at address: ${this.config.contractAddress}`);
      }

      // 4. Initialize transaction manager
      this.transactionManager = new TransactionManager(
        this.provider,
        this.walletManager,
        this.contractManager
      );

      // 5. Initialize event listener (optional)
      if (this.config.enableEventListener) {
        this.eventListener = new EventListener(this.provider, this.contractManager);

        // Start listening to credential events
        await this.eventListener.startListening('credentialRegistry', [
          'CredentialIssued',
          'CredentialRevoked',
          'ConsentGranted',
        ]);

        // Set up event handlers
        this._setupEventHandlers();
      }

      // 6. Initialize transaction queue (optional)
      if (this.config.enableQueue) {
        this.transactionQueue = new TransactionQueue(this.transactionManager);
        this.transactionQueue.startProcessing();

        // Set up queue event handlers
        this._setupQueueHandlers();
      }

      this.isInitialized = true;

      this.logger.success('Credential Service initialized successfully', {
        network: this.config.network,
        walletAddress: this.walletManager.getAddress(),
        contractAddress: this.config.contractAddress,
      });
    } catch (error) {
      this.logger.error('Failed to initialize Credential Service', error);
      throw error;
    }
  }

  /**
   * Shutdown the credential service
   */
  async shutdown() {
    try {
      this.logger.info('Shutting down Credential Service');

      if (this.transactionQueue) {
        this.transactionQueue.stopProcessing();
      }

      if (this.eventListener) {
        this.eventListener.stopListening();
      }

      if (this.provider) {
        await this.provider.disconnect();
      }

      this.isInitialized = false;

      this.logger.success('Credential Service shutdown complete');
    } catch (error) {
      this.logger.error('Error during shutdown', error);
    }
  }

  /**
   * Issue a credential on blockchain
   */
  async issueCredential(credentialHash, holderAddress, credentialType, options = {}) {
    this._ensureInitialized();

    try {
      // Validate inputs
      const validatedHash = BlockchainValidator.hashToBytes32(credentialHash);
      const validatedHolder = BlockchainValidator.validateAddress(holderAddress);
      const validatedType = BlockchainValidator.validateCredentialType(credentialType);

      const {
        priority = QUEUE.PRIORITIES.HIGH,
        useQueue = this.config.enableQueue,
        metadata = {},
      } = options;

      this.logger.info('Issuing credential', {
        credentialHash: validatedHash,
        holder: validatedHolder,
        type: validatedType,
        useQueue,
      });

      if (useQueue && this.transactionQueue) {
        // Add to queue
        const txId = await this.transactionQueue.addContractCall(
          'credentialRegistry',
          'issueCredential',
          [validatedHash, validatedHolder, validatedType],
          {
            priority,
            metadata: {
              ...metadata,
              operation: 'issueCredential',
              credentialHash: validatedHash,
              holder: validatedHolder,
              type: validatedType,
            },
          }
        );

        return {
          queued: true,
          txId,
          message: 'Credential issuance queued for processing',
        };
      } else {
        // Execute immediately
        const result = await this.transactionManager.executeContractMethod(
          'credentialRegistry',
          'issueCredential',
          [validatedHash, validatedHolder, validatedType],
          {
            priorityLevel: 'high',
            confirmations: 1,
          }
        );

        // Extract credential ID from event
        const credentialId = await this._extractCredentialIdFromReceipt(result.receipt);

        this.logger.success('Credential issued successfully', {
          txHash: result.tx.hash,
          credentialId,
          blockNumber: result.receipt.blockNumber,
        });

        return {
          success: true,
          transactionHash: result.tx.hash,
          credentialId,
          blockNumber: result.receipt.blockNumber,
          gasUsed: result.receipt.gasUsed.toString(),
        };
      }
    } catch (error) {
      this.logger.error('Failed to issue credential', error, {
        credentialHash,
        holderAddress,
        credentialType,
      });
      throw error;
    }
  }

  /**
   * Verify a credential on blockchain
   */
  async verifyCredential(credentialId, documentHash) {
    this._ensureInitialized();

    try {
      const validatedId = BlockchainValidator.validateBytes32(credentialId);
      const validatedHash = BlockchainValidator.hashToBytes32(documentHash);

      this.logger.info('Verifying credential', {
        credentialId: validatedId,
        documentHash: validatedHash,
      });

      const isValid = await this.contractManager.call(
        'verifyCredential',
        [validatedId, validatedHash],
        'credentialRegistry'
      );

      this.logger.success('Credential verified', {
        credentialId: validatedId,
        isValid,
      });

      return {
        credentialId: validatedId,
        isValid,
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to verify credential', error, {
        credentialId,
        documentHash,
      });
      throw error;
    }
  }

  /**
   * Get credential details
   */
  async getCredential(credentialId) {
    this._ensureInitialized();

    try {
      const validatedId = BlockchainValidator.validateBytes32(credentialId);

      this.logger.info('Fetching credential details', {
        credentialId: validatedId,
      });

      const credential = await this.contractManager.call(
        'getCredential',
        [validatedId],
        'credentialRegistry'
      );

      const credentialData = {
        credentialId: validatedId,
        credentialHash: credential[0],
        issuer: credential[1],
        holder: credential[2],
        issuedAt: Number(credential[3]),
        isRevoked: credential[4],
        credentialType: Number(credential[5]),
      };

      this.logger.success('Credential details retrieved', {
        credentialId: validatedId,
        isRevoked: credentialData.isRevoked,
      });

      return credentialData;
    } catch (error) {
      this.logger.error('Failed to get credential', error, {
        credentialId,
      });
      throw error;
    }
  }

  /**
   * Get all credentials for a holder
   */
  async getHolderCredentials(holderAddress) {
    this._ensureInitialized();

    try {
      const validatedAddress = BlockchainValidator.validateAddress(holderAddress);

      this.logger.info('Fetching holder credentials', {
        holder: validatedAddress,
      });

      const credentialIds = await this.contractManager.call(
        'getHolderCredentials',
        [validatedAddress],
        'credentialRegistry'
      );

      this.logger.success(`Found ${credentialIds.length} credentials for holder`, {
        holder: validatedAddress,
        count: credentialIds.length,
      });

      return credentialIds;
    } catch (error) {
      this.logger.error('Failed to get holder credentials', error, {
        holderAddress,
      });
      throw error;
    }
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(credentialId, options = {}) {
    this._ensureInitialized();

    try {
      const validatedId = BlockchainValidator.validateBytes32(credentialId);

      const {
        priority = QUEUE.PRIORITIES.HIGH,
        useQueue = this.config.enableQueue,
        metadata = {},
      } = options;

      this.logger.info('Revoking credential', {
        credentialId: validatedId,
        useQueue,
      });

      if (useQueue && this.transactionQueue) {
        const txId = await this.transactionQueue.addContractCall(
          'credentialRegistry',
          'revokeCredential',
          [validatedId],
          {
            priority,
            metadata: {
              ...metadata,
              operation: 'revokeCredential',
              credentialId: validatedId,
            },
          }
        );

        return {
          queued: true,
          txId,
          message: 'Credential revocation queued for processing',
        };
      } else {
        const result = await this.transactionManager.executeContractMethod(
          'credentialRegistry',
          'revokeCredential',
          [validatedId],
          {
            priorityLevel: 'high',
            confirmations: 1,
          }
        );

        this.logger.success('Credential revoked successfully', {
          credentialId: validatedId,
          txHash: result.tx.hash,
        });

        return {
          success: true,
          transactionHash: result.tx.hash,
          blockNumber: result.receipt.blockNumber,
        };
      }
    } catch (error) {
      this.logger.error('Failed to revoke credential', error, {
        credentialId,
      });
      throw error;
    }
  }

  /**
   * Grant consent for credential access
   */
  async grantConsent(verifierAddress, credentialId, options = {}) {
    this._ensureInitialized();

    try {
      const validatedVerifier = BlockchainValidator.validateAddress(verifierAddress);
      const validatedId = BlockchainValidator.validateBytes32(credentialId);

      const {
        priority = QUEUE.PRIORITIES.NORMAL,
        useQueue = this.config.enableQueue,
        metadata = {},
      } = options;

      this.logger.info('Granting consent', {
        verifier: validatedVerifier,
        credentialId: validatedId,
        useQueue,
      });

      if (useQueue && this.transactionQueue) {
        const txId = await this.transactionQueue.addContractCall(
          'credentialRegistry',
          'grantConsent',
          [validatedVerifier, validatedId],
          {
            priority,
            metadata: {
              ...metadata,
              operation: 'grantConsent',
              verifier: validatedVerifier,
              credentialId: validatedId,
            },
          }
        );

        return {
          queued: true,
          txId,
          message: 'Consent grant queued for processing',
        };
      } else {
        const result = await this.transactionManager.executeContractMethod(
          'credentialRegistry',
          'grantConsent',
          [validatedVerifier, validatedId],
          {
            priorityLevel: 'standard',
            confirmations: 1,
          }
        );

        this.logger.success('Consent granted successfully', {
          verifier: validatedVerifier,
          credentialId: validatedId,
          txHash: result.tx.hash,
        });

        return {
          success: true,
          transactionHash: result.tx.hash,
          blockNumber: result.receipt.blockNumber,
        };
      }
    } catch (error) {
      this.logger.error('Failed to grant consent', error, {
        verifierAddress,
        credentialId,
      });
      throw error;
    }
  }

  /**
   * Query historical credential events
   */
  async queryCredentialEvents(eventName, fromBlock = 0, toBlock = 'latest') {
    this._ensureInitialized();

    try {
      if (!this.eventListener) {
        throw new Error('Event listener is not enabled');
      }

      this.logger.info('Querying credential events', {
        eventName,
        fromBlock,
        toBlock,
      });

      const events = await this.eventListener.queryEvents(
        'credentialRegistry',
        eventName,
        fromBlock,
        toBlock
      );

      this.logger.success(`Found ${events.length} events`, {
        eventName,
        count: events.length,
      });

      return events;
    } catch (error) {
      this.logger.error('Failed to query events', error, {
        eventName,
        fromBlock,
        toBlock,
      });
      throw error;
    }
  }

  /**
   * Watch for credential events
   */
  watchCredentialEvents(eventName, callback) {
    this._ensureInitialized();

    if (!this.eventListener) {
      throw new Error('Event listener is not enabled');
    }

    return this.eventListener.watchEvent('credentialRegistry', eventName, callback);
  }

  /**
   * Get service health status
   */
  async getHealthStatus() {
    try {
      const health = {
        service: 'CredentialService',
        initialized: this.isInitialized,
        timestamp: new Date().toISOString(),
      };

      if (!this.isInitialized) {
        health.status = 'not_initialized';
        return health;
      }

      // Provider health
      const providerHealth = await this.provider.healthCheck();
      health.provider = providerHealth;

      // Wallet health
      const walletInfo = await this.walletManager.getWalletInfo();
      health.wallet = {
        address: walletInfo.address,
        balance: walletInfo.balanceEth + ' ETH',
        balanceStatus: walletInfo.balanceStatus,
      };

      // Contract health
      const contractDeployed = await this.contractManager.isDeployed('credentialRegistry');
      health.contract = {
        address: this.config.contractAddress,
        deployed: contractDeployed,
      };

      // Queue health
      if (this.transactionQueue) {
        health.queue = this.transactionQueue.getStatus();
      }

      // Event listener health
      if (this.eventListener) {
        health.eventListener = this.eventListener.getStatus();
      }

      health.status = 'healthy';

      return health;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        service: 'CredentialService',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Extract credential ID from transaction receipt
   */
  async _extractCredentialIdFromReceipt(receipt) {
    try {
      const contract = this.contractManager.getContract('credentialRegistry');
      const event = BlockchainHelpers.extractEvent(receipt, 'CredentialIssued', contract.interface);

      if (event && event.args && event.args.credentialId) {
        return event.args.credentialId;
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to extract credential ID from receipt', error);
      return null;
    }
  }

  /**
   * Setup event handlers
   */
  _setupEventHandlers() {
    if (!this.eventListener) return;

    this.eventListener.on('event', (eventData) => {
      this.logger.event(eventData.eventName, eventData.contractId, {
        args: eventData.args,
        blockNumber: eventData.blockNumber,
        transactionHash: eventData.transactionHash,
      });
    });
  }

  /**
   * Setup queue handlers
   */
  _setupQueueHandlers() {
    if (!this.transactionQueue) return;

    this.transactionQueue.on('transaction:completed', ({ txId, result }) => {
      this.logger.success('Queued transaction completed', {
        txId,
        txHash: result.tx.hash,
      });
    });

    this.transactionQueue.on('transaction:failed', ({ txId, error }) => {
      this.logger.error('Queued transaction failed', error, { txId });
    });
  }

  /**
   * Ensure service is initialized
   */
  _ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Credential service not initialized. Call initialize() first.');
    }
  }

  /**
   * Get queue status (if enabled)
   */
  getQueueStatus() {
    if (!this.transactionQueue) {
      return { enabled: false };
    }

    return {
      enabled: true,
      ...this.transactionQueue.getStatus(),
      statistics: this.transactionQueue.getStatistics(),
    };
  }

  /**
   * Get transaction status from queue
   */
  getTransactionStatus(txId) {
    if (!this.transactionQueue) {
      throw new Error('Transaction queue is not enabled');
    }

    return this.transactionQueue.getTransactionStatus(txId);
  }
}

module.exports = CredentialService;
