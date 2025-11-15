/**
 * Transaction Manager
 * Manages transaction execution with gas estimation and retry logic
 */

const { createLogger } = require('../utils/logger');
const {
  TransactionError,
  GasEstimationError,
  TimeoutError,
  NonceError,
} = require('../utils/errors');
const { GAS, RETRY, TX_STATUS, TIMEOUTS } = require('../utils/constants');
const BlockchainValidator = require('../utils/validators');
const BlockchainHelpers = require('../utils/helpers');

class TransactionManager {
  constructor(provider, walletManager, contractManager) {
    this.logger = createLogger('TransactionManager');
    this.provider = provider;
    this.walletManager = walletManager;
    this.contractManager = contractManager;
    this.pendingTransactions = new Map(); // txHash -> txData
    this.nonceCache = new Map(); // address -> nonce
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(transaction, bufferMultiplier = GAS.ESTIMATION_BUFFER) {
    try {
      this.logger.debug('Estimating gas for transaction', { transaction });

      const gasEstimate = await this.provider.estimateGas(transaction);
      const gasWithBuffer = BigInt(Math.floor(Number(gasEstimate) * bufferMultiplier));

      this.logger.debug('Gas estimated', {
        estimate: gasEstimate.toString(),
        withBuffer: gasWithBuffer.toString(),
        buffer: `${((bufferMultiplier - 1) * 100).toFixed(0)}%`,
      });

      return gasWithBuffer;
    } catch (error) {
      this.logger.error('Gas estimation failed', error, { transaction });

      throw new GasEstimationError('Failed to estimate gas', {
        transaction,
        reason: BlockchainHelpers.parseContractError(error),
        originalError: error.message,
      });
    }
  }

  /**
   * Get optimal gas price
   */
  async getOptimalGasPrice(priorityLevel = 'standard') {
    try {
      const feeData = await this.provider.getFeeData();

      // For EIP-1559 networks
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        const baseFee = feeData.maxFeePerGas - feeData.maxPriorityFeePerGas;
        const priorityMultiplier = GAS.PRICE_MULTIPLIERS[priorityLevel.toUpperCase()] || GAS.PRICE_MULTIPLIERS.STANDARD;

        const maxPriorityFeePerGas = BlockchainHelpers.gweiToWei(GAS.EIP1559.DEFAULT_PRIORITY_FEE_GWEI);
        const maxFeePerGas = baseFee * BigInt(GAS.EIP1559.MAX_FEE_MULTIPLIER) + maxPriorityFeePerGas;

        // Apply priority multiplier
        const adjustedMaxFee = BigInt(Math.floor(Number(maxFeePerGas) * priorityMultiplier));
        const adjustedPriorityFee = BigInt(Math.floor(Number(maxPriorityFeePerGas) * priorityMultiplier));

        return {
          type: 'eip1559',
          maxFeePerGas: adjustedMaxFee,
          maxPriorityFeePerGas: adjustedPriorityFee,
        };
      }

      // For legacy networks
      const gasPrice = feeData.gasPrice;
      const multiplier = GAS.PRICE_MULTIPLIERS[priorityLevel.toUpperCase()] || GAS.PRICE_MULTIPLIERS.STANDARD;
      const adjustedGasPrice = BigInt(Math.floor(Number(gasPrice) * multiplier));

      return {
        type: 'legacy',
        gasPrice: adjustedGasPrice,
      };
    } catch (error) {
      this.logger.error('Failed to get optimal gas price', error);
      throw new GasEstimationError('Failed to get optimal gas price', {
        priorityLevel,
        originalError: error.message,
      });
    }
  }

  /**
   * Get next nonce for address
   */
  async getNextNonce(address, useCache = true) {
    try {
      const validatedAddress = BlockchainValidator.validateAddress(address);

      if (useCache && this.nonceCache.has(validatedAddress)) {
        const cachedNonce = this.nonceCache.get(validatedAddress);
        this.logger.debug('Using cached nonce', { address: validatedAddress, nonce: cachedNonce });
        return cachedNonce;
      }

      const nonce = await this.provider.getTransactionCount(validatedAddress, 'pending');
      this.nonceCache.set(validatedAddress, nonce);

      this.logger.debug('Retrieved nonce from blockchain', {
        address: validatedAddress,
        nonce,
      });

      return nonce;
    } catch (error) {
      this.logger.error('Failed to get nonce', error, { address });
      throw new NonceError('Failed to get nonce', {
        address,
        originalError: error.message,
      });
    }
  }

  /**
   * Increment cached nonce
   */
  incrementNonce(address) {
    const validatedAddress = BlockchainValidator.validateAddress(address);

    if (this.nonceCache.has(validatedAddress)) {
      const currentNonce = this.nonceCache.get(validatedAddress);
      this.nonceCache.set(validatedAddress, currentNonce + 1);
      this.logger.debug('Incremented cached nonce', {
        address: validatedAddress,
        nonce: currentNonce + 1,
      });
    }
  }

  /**
   * Clear nonce cache for address
   */
  clearNonceCache(address = null) {
    if (address) {
      const validatedAddress = BlockchainValidator.validateAddress(address);
      this.nonceCache.delete(validatedAddress);
      this.logger.debug('Cleared nonce cache for address', { address: validatedAddress });
    } else {
      this.nonceCache.clear();
      this.logger.debug('Cleared all nonce cache');
    }
  }

  /**
   * Prepare transaction with gas and nonce
   */
  async prepareTransaction(transaction, options = {}) {
    try {
      const {
        priorityLevel = 'standard',
        gasLimit = null,
        nonce = null,
        from = null,
      } = options;

      const preparedTx = { ...transaction };

      // Set from address
      if (from) {
        preparedTx.from = BlockchainValidator.validateAddress(from);
      }

      // Estimate gas if not provided
      if (!gasLimit) {
        preparedTx.gasLimit = await this.estimateGas(preparedTx);
      } else {
        preparedTx.gasLimit = BlockchainValidator.validateGasLimit(gasLimit);
      }

      // Get optimal gas price
      const gasPricing = await this.getOptimalGasPrice(priorityLevel);

      if (gasPricing.type === 'eip1559') {
        preparedTx.maxFeePerGas = gasPricing.maxFeePerGas;
        preparedTx.maxPriorityFeePerGas = gasPricing.maxPriorityFeePerGas;
        delete preparedTx.gasPrice; // Remove gasPrice for EIP-1559
      } else {
        preparedTx.gasPrice = gasPricing.gasPrice;
      }

      // Set nonce
      if (nonce !== null) {
        preparedTx.nonce = nonce;
      } else if (preparedTx.from) {
        preparedTx.nonce = await this.getNextNonce(preparedTx.from);
      }

      this.logger.debug('Transaction prepared', {
        to: preparedTx.to,
        gasLimit: preparedTx.gasLimit?.toString(),
        nonce: preparedTx.nonce,
        gasPricing,
      });

      return preparedTx;
    } catch (error) {
      this.logger.error('Failed to prepare transaction', error);
      throw new TransactionError('Failed to prepare transaction', {
        originalError: error.message,
      });
    }
  }

  /**
   * Send transaction with retry logic
   */
  async sendTransaction(transaction, options = {}) {
    const {
      walletId = 'default',
      maxRetries = RETRY.MAX_ATTEMPTS,
      confirmations = null,
      timeout = TIMEOUTS.CONFIRMATION,
    } = options;

    let lastError;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        attempt++;

        this.logger.info(`Sending transaction (attempt ${attempt}/${maxRetries})`, {
          to: transaction.to,
          attempt,
        });

        // Prepare transaction
        const wallet = this.walletManager.getWallet(walletId);
        const preparedTx = await this.prepareTransaction(transaction, {
          ...options,
          from: wallet.address,
        });

        // Send transaction
        const tx = await wallet.sendTransaction(preparedTx);

        // Track transaction
        this._trackTransaction(tx.hash, {
          transaction: preparedTx,
          walletId,
          attempt,
          status: TX_STATUS.PENDING,
          submittedAt: new Date().toISOString(),
        });

        this.logger.transaction(tx.hash, 'sent', {
          from: wallet.address,
          to: preparedTx.to,
          attempt,
        });

        // Increment nonce cache
        this.incrementNonce(wallet.address);

        // Wait for confirmation if required
        if (confirmations !== null && confirmations > 0) {
          const receipt = await this.waitForConfirmation(tx.hash, confirmations, timeout);

          this._updateTransaction(tx.hash, {
            status: receipt.status === 1 ? TX_STATUS.CONFIRMED : TX_STATUS.FAILED,
            receipt,
            confirmedAt: new Date().toISOString(),
          });

          return { tx, receipt };
        }

        return { tx, receipt: null };
      } catch (error) {
        lastError = error;

        this.logger.error(`Transaction failed (attempt ${attempt}/${maxRetries})`, error, {
          attempt,
          maxRetries,
        });

        // Check if error is retryable
        if (attempt < maxRetries && BlockchainHelpers.isRetryableError(error)) {
          // Clear nonce cache and retry
          this.clearNonceCache(this.walletManager.getAddress(walletId));

          const delay = Math.min(
            RETRY.INITIAL_DELAY * Math.pow(RETRY.BACKOFF_MULTIPLIER, attempt - 1),
            RETRY.MAX_DELAY
          );

          this.logger.info(`Retrying transaction in ${delay}ms...`, { attempt, delay });
          await BlockchainHelpers.sleep(delay);
          continue;
        }

        // Not retryable or max retries reached
        break;
      }
    }

    throw new TransactionError(
      `Transaction failed after ${attempt} attempts`,
      {
        attempts: attempt,
        lastError: lastError?.message,
      }
    );
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txHash, confirmations = null, timeout = TIMEOUTS.CONFIRMATION) {
    try {
      const validatedHash = BlockchainValidator.validateTxHash(txHash);
      const requiredConfirmations = confirmations || this.provider.getNetworkInfo().confirmations;

      this.logger.info('Waiting for transaction confirmation', {
        txHash: validatedHash,
        confirmations: requiredConfirmations,
        timeout,
      });

      this._updateTransaction(txHash, { status: TX_STATUS.MINING });

      const receipt = await this.provider.waitForTransaction(
        validatedHash,
        requiredConfirmations,
        timeout
      );

      if (!receipt) {
        throw new TimeoutError('Transaction receipt is null');
      }

      if (receipt.status === 0) {
        throw new TransactionError('Transaction reverted', {
          txHash: validatedHash,
          receipt: BlockchainHelpers.parseReceipt(receipt),
        });
      }

      this.logger.success('Transaction confirmed', {
        txHash: validatedHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status,
      });

      return receipt;
    } catch (error) {
      this.logger.error('Failed to wait for confirmation', error, { txHash });

      if (error instanceof TimeoutError) {
        this._updateTransaction(txHash, { status: TX_STATUS.PENDING });
      } else {
        this._updateTransaction(txHash, { status: TX_STATUS.FAILED });
      }

      throw error;
    }
  }

  /**
   * Execute contract method with retry logic
   */
  async executeContractMethod(contractId, method, params = [], options = {}) {
    try {
      const {
        walletId = 'default',
        priorityLevel = 'standard',
        confirmations = null,
        timeout = TIMEOUTS.CONFIRMATION,
      } = options;

      this.logger.info(`Executing contract method: ${method}`, {
        contractId,
        params,
      });

      // Estimate gas for contract call
      const gasEstimate = await this.contractManager.estimateGas(method, params, {}, contractId);
      const gasLimit = BigInt(Math.floor(Number(gasEstimate) * GAS.ESTIMATION_BUFFER));

      // Prepare transaction options
      const txOptions = {
        walletId,
        priorityLevel,
        gasLimit,
        confirmations,
        timeout,
      };

      // Get contract address
      const contractAddress = this.contractManager.getContractAddress(contractId);

      // Execute transaction
      const tx = await this.contractManager.execute(method, params, { gasLimit }, contractId);

      // Wait for confirmation
      const receipt = await this.waitForConfirmation(tx.hash, confirmations, timeout);

      this.logger.success(`Contract method ${method} executed successfully`, {
        contractId,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      });

      return { tx, receipt };
    } catch (error) {
      this.logger.error(`Failed to execute contract method: ${method}`, error, {
        contractId,
        params,
      });

      throw new TransactionError(`Failed to execute contract method: ${method}`, {
        contractId,
        method,
        params,
        originalError: error.message,
      });
    }
  }

  /**
   * Cancel pending transaction (replace with higher gas price)
   */
  async cancelTransaction(txHash, walletId = 'default', priorityLevel = 'urgent') {
    try {
      const validatedHash = BlockchainValidator.validateTxHash(txHash);
      const txData = this.pendingTransactions.get(validatedHash);

      if (!txData) {
        throw new TransactionError('Transaction not found in pending transactions');
      }

      this.logger.info('Attempting to cancel transaction', { txHash: validatedHash });

      const wallet = this.walletManager.getWallet(walletId);

      // Create replacement transaction with same nonce but higher gas price
      const gasPricing = await this.getOptimalGasPrice(priorityLevel);

      const cancelTx = {
        to: wallet.address, // Send to self
        value: 0,
        nonce: txData.transaction.nonce,
      };

      if (gasPricing.type === 'eip1559') {
        cancelTx.maxFeePerGas = gasPricing.maxFeePerGas;
        cancelTx.maxPriorityFeePerGas = gasPricing.maxPriorityFeePerGas;
      } else {
        cancelTx.gasPrice = gasPricing.gasPrice;
      }

      const tx = await wallet.sendTransaction(cancelTx);

      this._updateTransaction(validatedHash, { status: TX_STATUS.CANCELLED });

      this.logger.success('Transaction cancelled', {
        originalTxHash: validatedHash,
        cancelTxHash: tx.hash,
      });

      return tx;
    } catch (error) {
      this.logger.error('Failed to cancel transaction', error, { txHash });
      throw new TransactionError('Failed to cancel transaction', {
        txHash,
        originalError: error.message,
      });
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash) {
    try {
      const validatedHash = BlockchainValidator.validateTxHash(txHash);

      // Check if we're tracking this transaction
      const tracked = this.pendingTransactions.get(validatedHash);

      // Get transaction from blockchain
      const tx = await this.provider.getTransaction(validatedHash);

      if (!tx) {
        return {
          found: false,
          status: 'not_found',
          tracked: !!tracked,
        };
      }

      // Get receipt
      const receipt = await this.provider.getTransactionReceipt(validatedHash);

      let status = TX_STATUS.PENDING;

      if (receipt) {
        status = receipt.status === 1 ? TX_STATUS.CONFIRMED : TX_STATUS.FAILED;
      }

      return {
        found: true,
        status,
        tracked: !!tracked,
        tx: {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          nonce: tx.nonce,
          gasLimit: tx.gasLimit?.toString(),
          gasPrice: tx.gasPrice?.toString(),
          blockNumber: tx.blockNumber,
        },
        receipt: receipt ? BlockchainHelpers.parseReceipt(receipt) : null,
      };
    } catch (error) {
      this.logger.error('Failed to get transaction status', error, { txHash });
      throw new TransactionError('Failed to get transaction status', {
        txHash,
        originalError: error.message,
      });
    }
  }

  /**
   * Track transaction
   */
  _trackTransaction(txHash, data) {
    this.pendingTransactions.set(txHash, {
      ...data,
      trackedAt: new Date().toISOString(),
    });

    this.logger.debug('Transaction tracked', { txHash });
  }

  /**
   * Update tracked transaction
   */
  _updateTransaction(txHash, updates) {
    const existing = this.pendingTransactions.get(txHash);

    if (existing) {
      this.pendingTransactions.set(txHash, {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      this.logger.debug('Transaction updated', { txHash, updates });
    }
  }

  /**
   * Remove tracked transaction
   */
  removeTrackedTransaction(txHash) {
    if (this.pendingTransactions.has(txHash)) {
      this.pendingTransactions.delete(txHash);
      this.logger.debug('Transaction removed from tracking', { txHash });
      return true;
    }

    return false;
  }

  /**
   * Get all pending transactions
   */
  getPendingTransactions() {
    const pending = [];

    for (const [txHash, data] of this.pendingTransactions.entries()) {
      if (data.status === TX_STATUS.PENDING || data.status === TX_STATUS.MINING) {
        pending.push({ txHash, ...data });
      }
    }

    return pending;
  }

  /**
   * Clear completed transactions
   */
  clearCompletedTransactions() {
    let cleared = 0;

    for (const [txHash, data] of this.pendingTransactions.entries()) {
      if (data.status === TX_STATUS.CONFIRMED || data.status === TX_STATUS.FAILED) {
        this.pendingTransactions.delete(txHash);
        cleared++;
      }
    }

    this.logger.info(`Cleared ${cleared} completed transactions`);
    return cleared;
  }
}

module.exports = TransactionManager;
