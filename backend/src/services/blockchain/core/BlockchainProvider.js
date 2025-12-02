/**
 * Blockchain Provider
 * Manages blockchain connections and provider instances
 */

const { ethers } = require('ethers');
const { createLogger } = require('../utils/logger');
const { NetworkError, ConnectionError } = require('../utils/errors');
const { NETWORKS, TIMEOUTS, CACHE_TTL } = require('../utils/constants');
const BlockchainValidator = require('../utils/validators');

const shouldUseMockProvider = process.env.MOCK_BLOCKCHAIN_PROVIDER === 'true';

class BlockchainProvider {
  constructor(network = 'localhost', options = {}) {
    const {
      useMockProvider = shouldUseMockProvider,
      maxRetries = 5,
    } = options;

    this.logger = createLogger('BlockchainProvider');
    this.network = BlockchainValidator.validateNetwork(network, Object.keys(NETWORKS).map(k => NETWORKS[k].name));
    this.networkConfig = this._getNetworkConfig();
    this.provider = null;
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = maxRetries;
    this.cache = new Map();
    this.useMockProvider = useMockProvider;
  }

  /**
   * Get network configuration
   */
  _getNetworkConfig() {
    for (const config of Object.values(NETWORKS)) {
      if (config.name === this.network) {
        return config;
      }
    }
    throw new NetworkError(`Network configuration not found for: ${this.network}`);
  }

  /**
   * Initialize provider connection
   */
  async connect() {
    try {
      this.logger.info(`Connecting to ${this.network} network...`, {
        rpcUrl: this.networkConfig.rpcUrl,
        chainId: this.networkConfig.chainId,
      });

      // Determine RPC URL
      let rpcUrl = this.networkConfig.rpcUrl;

      if (this.useMockProvider) {
        this.provider = this._createMockProvider();
      } else {
        // For Sepolia/Mainnet, use environment variable if available
        if (this.network === 'sepolia' && process.env.SEPOLIA_RPC_URL) {
          rpcUrl = process.env.SEPOLIA_RPC_URL;
        } else if (this.network === 'mainnet' && process.env.MAINNET_RPC_URL) {
          rpcUrl = process.env.MAINNET_RPC_URL;
        } else if (process.env.BLOCKCHAIN_RPC_URL) {
          rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
        }

        // Create provider
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
      }

      // Verify connection
      await this._verifyConnection();

      this.isConnected = true;
      this.connectionRetries = 0;

      const latestBlockNumber = await this.provider.getBlockNumber();
      this.logger.success(`Connected to ${this.network} network${this.useMockProvider ? ' (mock)' : ''}`, {
        chainId: this.networkConfig.chainId,
        blockNumber: latestBlockNumber,
      });

      return this.provider;
    } catch (error) {
      this.isConnected = false;
      this.logger.error('Failed to connect to blockchain network', error, {
        network: this.network,
        attempt: this.connectionRetries + 1,
      });

      if (error instanceof NetworkError) {
        throw error;
      }

      // Retry connection
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        this.logger.info(`Retrying connection (${this.connectionRetries}/${this.maxRetries})...`);
        await this._sleep(2000 * this.connectionRetries); // Exponential backoff
        return this.connect();
      }

      throw new ConnectionError(
        `Failed to connect to ${this.network} after ${this.maxRetries} attempts`,
        { network: this.network, originalError: error.message }
      );
    }
  }

  /**
   * Verify blockchain connection
   */
  async _verifyConnection() {
    try {
      const network = await Promise.race([
        this.provider.getNetwork(),
        this._timeout(TIMEOUTS.RPC_CALL, 'Network verification timeout'),
      ]);

      // Verify chain ID matches
      if (Number(network.chainId) !== this.networkConfig.chainId) {
        throw new NetworkError(
          `Chain ID mismatch. Expected ${this.networkConfig.chainId}, got ${network.chainId}`
        );
      }

      // Verify we can get block number
      await this.provider.getBlockNumber();

      return true;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new ConnectionError('Failed to verify blockchain connection', {
        originalError: error.message,
      });
    }
  }

  /**
   * Disconnect from blockchain
   */
  async disconnect() {
    if (this.provider) {
      this.provider.removeAllListeners();
      this.provider = null;
      this.isConnected = false;
      this.cache.clear();
      this.logger.info('Disconnected from blockchain network');
    }
  }

  /**
   * Get provider instance
   */
  getProvider() {
    if (!this.isConnected || !this.provider) {
      throw new ConnectionError('Provider not connected. Call connect() first.');
    }
    return this.provider;
  }

  /**
   * Get current block number (with caching)
   */
  async getBlockNumber() {
    const cacheKey = 'blockNumber';
    const cached = this._getCache(cacheKey, CACHE_TTL.BLOCK_NUMBER);

    if (cached !== null) {
      return cached;
    }

    try {
      const blockNumber = await this.getProvider().getBlockNumber();
      this._setCache(cacheKey, blockNumber);
      return blockNumber;
    } catch (error) {
      this.logger.error('Failed to get block number', error);
      throw new NetworkError('Failed to get block number', {
        originalError: error.message,
      });
    }
  }

  /**
   * Get current gas price (with caching)
   */
  async getGasPrice() {
    const cacheKey = 'gasPrice';
    const cached = this._getCache(cacheKey, CACHE_TTL.GAS_PRICE);

    if (cached !== null) {
      return cached;
    }

    try {
      const feeData = await this.getProvider().getFeeData();
      const gasPrice = feeData.gasPrice;

      this._setCache(cacheKey, gasPrice);
      return gasPrice;
    } catch (error) {
      this.logger.error('Failed to get gas price', error);
      throw new NetworkError('Failed to get gas price', {
        originalError: error.message,
      });
    }
  }

  /**
   * Get fee data (EIP-1559)
   */
  async getFeeData() {
    try {
      const feeData = await this.getProvider().getFeeData();
      return {
        gasPrice: feeData.gasPrice,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      };
    } catch (error) {
      this.logger.error('Failed to get fee data', error);
      throw new NetworkError('Failed to get fee data', {
        originalError: error.message,
      });
    }
  }

  /**
   * Get balance of an address
   */
  async getBalance(address) {
    try {
      const validatedAddress = BlockchainValidator.validateAddress(address);
      const balance = await this.getProvider().getBalance(validatedAddress);
      return balance;
    } catch (error) {
      this.logger.error('Failed to get balance', error, { address });
      throw new NetworkError('Failed to get balance', {
        address,
        originalError: error.message,
      });
    }
  }

  /**
   * Get transaction count (nonce) for an address
   */
  async getTransactionCount(address, blockTag = 'latest') {
    try {
      const validatedAddress = BlockchainValidator.validateAddress(address);
      const count = await this.getProvider().getTransactionCount(validatedAddress, blockTag);
      return count;
    } catch (error) {
      this.logger.error('Failed to get transaction count', error, { address });
      throw new NetworkError('Failed to get transaction count', {
        address,
        originalError: error.message,
      });
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash) {
    try {
      const validatedHash = BlockchainValidator.validateTxHash(txHash);
      const tx = await this.getProvider().getTransaction(validatedHash);
      return tx;
    } catch (error) {
      this.logger.error('Failed to get transaction', error, { txHash });
      throw new NetworkError('Failed to get transaction', {
        txHash,
        originalError: error.message,
      });
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      const validatedHash = BlockchainValidator.validateTxHash(txHash);
      const receipt = await this.getProvider().getTransactionReceipt(validatedHash);
      return receipt;
    } catch (error) {
      this.logger.error('Failed to get transaction receipt', error, { txHash });
      throw new NetworkError('Failed to get transaction receipt', {
        txHash,
        originalError: error.message,
      });
    }
  }

  /**
   * Get block by number or hash
   */
  async getBlock(blockHashOrNumber) {
    try {
      const block = await this.getProvider().getBlock(blockHashOrNumber);
      return block;
    } catch (error) {
      this.logger.error('Failed to get block', error, { blockHashOrNumber });
      throw new NetworkError('Failed to get block', {
        blockHashOrNumber,
        originalError: error.message,
      });
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash, confirmations = null, timeout = null) {
    try {
      const validatedHash = BlockchainValidator.validateTxHash(txHash);
      const requiredConfirmations = confirmations || this.networkConfig.confirmations;
      const timeoutMs = timeout || TIMEOUTS.CONFIRMATION;

      this.logger.info('Waiting for transaction confirmation', {
        txHash: validatedHash,
        confirmations: requiredConfirmations,
        timeout: timeoutMs,
      });

      const receipt = await Promise.race([
        this.getProvider().waitForTransaction(validatedHash, requiredConfirmations),
        this._timeout(timeoutMs, 'Transaction confirmation timeout'),
      ]);

      if (!receipt) {
        throw new Error('Transaction receipt is null');
      }

      this.logger.success('Transaction confirmed', {
        txHash: validatedHash,
        blockNumber: receipt.blockNumber,
        status: receipt.status,
      });

      return receipt;
    } catch (error) {
      this.logger.error('Failed to wait for transaction', error, { txHash });
      throw new NetworkError('Failed to wait for transaction', {
        txHash,
        originalError: error.message,
      });
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction) {
    try {
      const gasEstimate = await this.getProvider().estimateGas(transaction);
      return gasEstimate;
    } catch (error) {
      this.logger.error('Failed to estimate gas', error, { transaction });
      throw new NetworkError('Failed to estimate gas', {
        transaction,
        originalError: error.message,
      });
    }
  }

  /**
   * Send raw transaction
   */
  async sendTransaction(signedTx) {
    try {
      const tx = await this.getProvider().broadcastTransaction(signedTx);
      this.logger.transaction(tx.hash, 'broadcasted');
      return tx;
    } catch (error) {
      this.logger.error('Failed to send transaction', error);
      throw new NetworkError('Failed to send transaction', {
        originalError: error.message,
      });
    }
  }

  /**
   * Check if provider is healthy
   */
  async healthCheck() {
    try {
      if (!this.isConnected || !this.provider) {
        return {
          healthy: false,
          network: this.network,
          connected: false,
          error: 'Provider not connected',
        };
      }

      // Try to get block number
      const blockNumber = await Promise.race([
        this.provider.getBlockNumber(),
        this._timeout(5000, 'Health check timeout'),
      ]);

      return {
        healthy: true,
        network: this.network,
        connected: true,
        chainId: this.networkConfig.chainId,
        blockNumber,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        healthy: false,
        network: this.network,
        connected: this.isConnected,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return {
      name: this.network,
      chainId: this.networkConfig.chainId,
      rpcUrl: this.networkConfig.rpcUrl,
      blockTime: this.networkConfig.blockTime,
      confirmations: this.networkConfig.confirmations,
      connected: this.isConnected,
    };
  }

  /**
   * Cache management
   */
  _setCache(key, value, ttl = 60) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl * 1000),
    });
  }

  _getCache(key, ttl = null) {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  _clearCache() {
    this.cache.clear();
  }

  _createMockProvider() {
    if (typeof global.__BLOCKCHAIN_PROVIDER_FACTORY__ === 'function') {
      return global.__BLOCKCHAIN_PROVIDER_FACTORY__(this.networkConfig);
    }
    return new InMemoryJsonRpcProvider(this.networkConfig);
  }

  /**
   * Utility: Create timeout promise
   */
  _timeout(ms, message = 'Operation timeout') {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Utility: Sleep
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class InMemoryJsonRpcProvider {
  constructor(networkConfig) {
    this.networkConfig = networkConfig;
    this.listeners = new Map();
  }

  async getNetwork() {
    return {
      chainId: BigInt(this.networkConfig.chainId),
      name: this.networkConfig.name,
    };
  }

  async getBlockNumber() {
    return 123;
  }

  async getFeeData() {
    return {
      gasPrice: 1000000000n,
      maxFeePerGas: 2000000000n,
      maxPriorityFeePerGas: 1000000000n,
    };
  }

  async getBalance() {
    return 10000000000000000000000n;
  }

  async getTransactionCount() {
    return 5;
  }

  async getTransaction(hash) {
    return {
      hash,
      from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      nonce: 0,
      gasLimit: 200000n,
      gasPrice: 1000000000n,
      data: '0x',
      value: 0n,
      chainId: this.networkConfig.chainId,
    };
  }

  async getTransactionReceipt(hash) {
    return {
      hash,
      status: 1,
      blockNumber: 123,
      gasUsed: 100000n,
    };
  }

  async getBlock(blockHashOrNumber) {
    return {
      number: typeof blockHashOrNumber === 'number' ? blockHashOrNumber : 123,
      hash: '0xabcdef',
      timestamp: Date.now(),
      transactions: [],
    };
  }

  async waitForTransaction(hash) {
    return {
      hash,
      status: 1,
      blockNumber: 123,
    };
  }

  async estimateGas() {
    return 100000n;
  }

  async broadcastTransaction(signedTx) {
    return {
      hash: signedTx || '0xmocktx',
    };
  }

  async getCode() {
    return '0x1234';
  }

  removeAllListeners() {
    this.listeners.clear();
  }
}

module.exports = BlockchainProvider;
