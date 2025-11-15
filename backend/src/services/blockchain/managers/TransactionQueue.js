/**
 * Transaction Queue
 * Manages queued transactions with priority and concurrency control
 */

const EventEmitter = require('events');
const { createLogger } = require('../utils/logger');
const { QueueError } = require('../utils/errors');
const { QUEUE, TX_STATUS } = require('../utils/constants');

class TransactionQueue extends EventEmitter {
  constructor(transactionManager) {
    super();
    this.logger = createLogger('TransactionQueue');
    this.transactionManager = transactionManager;
    this.queue = [];
    this.processing = new Map(); // txId -> processing data
    this.completed = new Map(); // txId -> result
    this.failed = new Map(); // txId -> error
    this.isProcessing = false;
    this.processingInterval = null;
    this.stats = {
      queued: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
    };
  }

  /**
   * Add transaction to queue
   */
  async addTransaction(transaction, options = {}) {
    try {
      const {
        priority = QUEUE.PRIORITIES.NORMAL,
        walletId = 'default',
        contractId = null,
        method = null,
        params = [],
        metadata = {},
      } = options;

      // Check queue size
      if (this.queue.length >= QUEUE.MAX_SIZE) {
        throw new QueueError('Queue is full', {
          currentSize: this.queue.length,
          maxSize: QUEUE.MAX_SIZE,
        });
      }

      // Generate transaction ID
      const txId = this._generateTxId();

      // Create queue item
      const queueItem = {
        txId,
        transaction,
        priority,
        walletId,
        contractId,
        method,
        params,
        metadata,
        status: TX_STATUS.QUEUED,
        addedAt: Date.now(),
        expiresAt: Date.now() + QUEUE.TTL,
        attempts: 0,
        maxAttempts: 3,
      };

      // Add to queue and sort by priority
      this.queue.push(queueItem);
      this._sortQueue();

      this.stats.queued++;

      this.logger.info('Transaction added to queue', {
        txId,
        priority,
        queueSize: this.queue.length,
      });

      this.emit('transaction:queued', queueItem);

      // Start processing if not already processing
      if (!this.isProcessing) {
        this.startProcessing();
      }

      return txId;
    } catch (error) {
      this.logger.error('Failed to add transaction to queue', error);
      throw new QueueError('Failed to add transaction to queue', {
        originalError: error.message,
      });
    }
  }

  /**
   * Add contract method call to queue
   */
  async addContractCall(contractId, method, params = [], options = {}) {
    try {
      const {
        priority = QUEUE.PRIORITIES.NORMAL,
        walletId = 'default',
        metadata = {},
      } = options;

      const txId = await this.addTransaction(null, {
        priority,
        walletId,
        contractId,
        method,
        params,
        metadata: {
          ...metadata,
          type: 'contract_call',
        },
      });

      this.logger.info('Contract call added to queue', {
        txId,
        contractId,
        method,
      });

      return txId;
    } catch (error) {
      this.logger.error('Failed to add contract call to queue', error);
      throw new QueueError('Failed to add contract call to queue', {
        contractId,
        method,
        originalError: error.message,
      });
    }
  }

  /**
   * Start processing queue
   */
  startProcessing(interval = QUEUE.PROCESS_INTERVAL) {
    if (this.isProcessing) {
      this.logger.warn('Queue processing is already running');
      return;
    }

    this.logger.info('Starting queue processing', { interval });

    this.isProcessing = true;
    this.processingInterval = setInterval(() => {
      this._processQueue();
    }, interval);

    // Process immediately
    this._processQueue();
  }

  /**
   * Stop processing queue
   */
  stopProcessing() {
    if (!this.isProcessing) {
      return;
    }

    this.logger.info('Stopping queue processing');

    this.isProcessing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process queue
   */
  async _processQueue() {
    try {
      // Remove expired transactions
      this._removeExpiredTransactions();

      // Check if we can process more transactions
      if (this.processing.size >= QUEUE.MAX_CONCURRENT) {
        this.logger.debug('Max concurrent transactions reached', {
          processing: this.processing.size,
          max: QUEUE.MAX_CONCURRENT,
        });
        return;
      }

      // Get next transaction to process
      const item = this._getNextTransaction();

      if (!item) {
        return; // Queue is empty
      }

      // Process transaction
      this._processTransaction(item);
    } catch (error) {
      this.logger.error('Error in queue processing', error);
    }
  }

  /**
   * Get next transaction from queue
   */
  _getNextTransaction() {
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];

      // Skip if already being processed
      if (this.processing.has(item.txId)) {
        continue;
      }

      // Remove from queue and return
      this.queue.splice(i, 1);
      return item;
    }

    return null;
  }

  /**
   * Process single transaction
   */
  async _processTransaction(item) {
    const { txId, contractId, method, params, walletId, transaction, metadata } = item;

    try {
      // Mark as processing
      this.processing.set(txId, {
        ...item,
        status: TX_STATUS.PENDING,
        startedAt: Date.now(),
      });

      item.attempts++;

      this.logger.info('Processing transaction', {
        txId,
        attempt: item.attempts,
        maxAttempts: item.maxAttempts,
      });

      this.emit('transaction:processing', item);

      let result;

      // Execute transaction
      if (contractId && method) {
        // Contract method call
        result = await this.transactionManager.executeContractMethod(
          contractId,
          method,
          params,
          {
            walletId,
            confirmations: 1,
          }
        );
      } else if (transaction) {
        // Direct transaction
        result = await this.transactionManager.sendTransaction(transaction, {
          walletId,
          confirmations: 1,
        });
      } else {
        throw new Error('Invalid transaction item: missing transaction or contract call details');
      }

      // Transaction successful
      this.processing.delete(txId);
      this.completed.set(txId, {
        ...item,
        result,
        status: TX_STATUS.CONFIRMED,
        completedAt: Date.now(),
      });

      this.stats.processed++;
      this.stats.succeeded++;

      this.logger.success('Transaction processed successfully', {
        txId,
        txHash: result.tx.hash,
      });

      this.emit('transaction:completed', {
        txId,
        result,
        item,
      });
    } catch (error) {
      this.logger.error('Transaction processing failed', error, {
        txId,
        attempt: item.attempts,
      });

      this.emit('transaction:error', {
        txId,
        error,
        item,
      });

      // Check if we should retry
      if (item.attempts < item.maxAttempts) {
        this.logger.info('Retrying transaction', {
          txId,
          attempt: item.attempts + 1,
          maxAttempts: item.maxAttempts,
        });

        // Re-add to queue with same priority
        this.processing.delete(txId);
        this.queue.unshift(item); // Add to front
        this._sortQueue();
      } else {
        // Max attempts reached
        this.processing.delete(txId);
        this.failed.set(txId, {
          ...item,
          error: error.message,
          status: TX_STATUS.FAILED,
          failedAt: Date.now(),
        });

        this.stats.processed++;
        this.stats.failed++;

        this.logger.error('Transaction failed after max attempts', null, {
          txId,
          attempts: item.attempts,
        });

        this.emit('transaction:failed', {
          txId,
          error,
          item,
        });
      }
    }
  }

  /**
   * Remove expired transactions
   */
  _removeExpiredTransactions() {
    const now = Date.now();
    const expired = [];

    for (let i = this.queue.length - 1; i >= 0; i--) {
      const item = this.queue[i];

      if (item.expiresAt < now) {
        expired.push(item);
        this.queue.splice(i, 1);
      }
    }

    if (expired.length > 0) {
      this.logger.info(`Removed ${expired.length} expired transactions from queue`);

      for (const item of expired) {
        this.failed.set(item.txId, {
          ...item,
          error: 'Transaction expired',
          status: TX_STATUS.FAILED,
          failedAt: now,
        });

        this.stats.failed++;

        this.emit('transaction:expired', item);
      }
    }
  }

  /**
   * Sort queue by priority
   */
  _sortQueue() {
    this.queue.sort((a, b) => {
      // Higher priority first
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      // Earlier added first
      return a.addedAt - b.addedAt;
    });
  }

  /**
   * Generate transaction ID
   */
  _generateTxId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(txId) {
    // Check if processing
    if (this.processing.has(txId)) {
      return {
        status: TX_STATUS.PENDING,
        data: this.processing.get(txId),
      };
    }

    // Check if completed
    if (this.completed.has(txId)) {
      return {
        status: TX_STATUS.CONFIRMED,
        data: this.completed.get(txId),
      };
    }

    // Check if failed
    if (this.failed.has(txId)) {
      return {
        status: TX_STATUS.FAILED,
        data: this.failed.get(txId),
      };
    }

    // Check if still in queue
    const queued = this.queue.find(item => item.txId === txId);
    if (queued) {
      return {
        status: TX_STATUS.QUEUED,
        data: queued,
      };
    }

    return null;
  }

  /**
   * Cancel transaction
   */
  cancelTransaction(txId) {
    try {
      // Check if in queue
      const queueIndex = this.queue.findIndex(item => item.txId === txId);

      if (queueIndex !== -1) {
        const item = this.queue.splice(queueIndex, 1)[0];

        this.failed.set(txId, {
          ...item,
          error: 'Cancelled by user',
          status: TX_STATUS.CANCELLED,
          cancelledAt: Date.now(),
        });

        this.stats.cancelled++;

        this.logger.info('Transaction cancelled', { txId });
        this.emit('transaction:cancelled', item);

        return true;
      }

      // Check if processing
      if (this.processing.has(txId)) {
        this.logger.warn('Cannot cancel transaction that is already processing', { txId });
        return false;
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to cancel transaction', error, { txId });
      throw new QueueError('Failed to cancel transaction', {
        txId,
        originalError: error.message,
      });
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.queue.length,
      processingCount: this.processing.size,
      completedCount: this.completed.size,
      failedCount: this.failed.size,
      maxConcurrent: QUEUE.MAX_CONCURRENT,
      maxSize: QUEUE.MAX_SIZE,
      stats: { ...this.stats },
    };
  }

  /**
   * Get queue items
   */
  getQueue() {
    return this.queue.map(item => ({
      txId: item.txId,
      priority: item.priority,
      status: item.status,
      addedAt: item.addedAt,
      expiresAt: item.expiresAt,
      attempts: item.attempts,
      metadata: item.metadata,
    }));
  }

  /**
   * Clear completed transactions
   */
  clearCompleted() {
    const count = this.completed.size;
    this.completed.clear();
    this.logger.info(`Cleared ${count} completed transactions`);
    return count;
  }

  /**
   * Clear failed transactions
   */
  clearFailed() {
    const count = this.failed.size;
    this.failed.clear();
    this.logger.info(`Cleared ${count} failed transactions`);
    return count;
  }

  /**
   * Clear all transactions
   */
  clearAll() {
    this.queue = [];
    this.completed.clear();
    this.failed.clear();
    this.logger.info('Cleared all transactions');
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      successRate: this.stats.processed > 0
        ? ((this.stats.succeeded / this.stats.processed) * 100).toFixed(2) + '%'
        : 'N/A',
      failureRate: this.stats.processed > 0
        ? ((this.stats.failed / this.stats.processed) * 100).toFixed(2) + '%'
        : 'N/A',
      currentQueue: this.queue.length,
      currentProcessing: this.processing.size,
      currentCompleted: this.completed.size,
      currentFailed: this.failed.size,
    };
  }
}

module.exports = TransactionQueue;
