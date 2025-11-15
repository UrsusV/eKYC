/**
 * Blockchain Helper Utilities
 */

const { ethers } = require('ethers');
const crypto = require('crypto');

class BlockchainHelpers {
  /**
   * Convert Gwei to Wei
   */
  static gweiToWei(gwei) {
    return ethers.parseUnits(gwei.toString(), 'gwei');
  }

  /**
   * Convert Wei to Gwei
   */
  static weiToGwei(wei) {
    return ethers.formatUnits(wei.toString(), 'gwei');
  }

  /**
   * Convert Wei to ETH
   */
  static weiToEth(wei) {
    return ethers.formatEther(wei.toString());
  }

  /**
   * Convert ETH to Wei
   */
  static ethToWei(eth) {
    return ethers.parseEther(eth.toString());
  }

  /**
   * Format address for display (0x1234...5678)
   */
  static formatAddress(address, startChars = 6, endChars = 4) {
    if (!address || address.length < startChars + endChars) {
      return address;
    }

    return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
  }

  /**
   * Format transaction hash for display
   */
  static formatTxHash(hash, startChars = 10, endChars = 8) {
    return this.formatAddress(hash, startChars, endChars);
  }

  /**
   * Calculate transaction cost in ETH
   */
  static calculateTxCost(gasUsed, gasPrice) {
    const cost = BigInt(gasUsed) * BigInt(gasPrice);
    return this.weiToEth(cost);
  }

  /**
   * Calculate EIP-1559 transaction cost
   */
  static calculateEIP1559Cost(gasUsed, baseFee, priorityFee) {
    const totalFee = BigInt(baseFee) + BigInt(priorityFee);
    const cost = BigInt(gasUsed) * totalFee;
    return this.weiToEth(cost);
  }

  /**
   * Generate credential ID from hash
   */
  static generateCredentialId(documentHash, holderAddress, timestamp) {
    const data = documentHash + holderAddress + timestamp.toString();
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  /**
   * Hash document content (SHA-256)
   */
  static hashDocument(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Convert SHA-256 hash to bytes32
   */
  static hashToBytes32(hash) {
    // Remove 0x prefix if present
    const cleanHash = hash.startsWith('0x') ? hash.slice(2) : hash;

    // Ensure it's 64 characters (32 bytes)
    if (cleanHash.length !== 64) {
      throw new Error('Invalid hash length. Expected 64 hex characters.');
    }

    return '0x' + cleanHash;
  }

  /**
   * Wait for specified time
   */
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry function with exponential backoff
   */
  static async retry(fn, options = {}) {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      onRetry = null,
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        if (onRetry) {
          onRetry(error, attempt);
        }

        await this.sleep(delay);
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Parse contract error message
   */
  static parseContractError(error) {
    // Extract revert reason from error
    if (error.reason) {
      return error.reason;
    }

    if (error.message) {
      // Try to extract custom error from message
      const match = error.message.match(/reverted with reason string '(.+)'/);
      if (match) {
        return match[1];
      }

      // Try to extract custom error name
      const customErrorMatch = error.message.match(/reverted with custom error '(.+)'/);
      if (customErrorMatch) {
        return customErrorMatch[1];
      }
    }

    return 'Unknown contract error';
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error) {
    const retryableCodes = [
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVER_ERROR',
      'NONCE_EXPIRED',
      'REPLACEMENT_UNDERPRICED',
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
    ];

    return retryableCodes.some(code =>
      error.code === code ||
      error.message?.includes(code) ||
      error.code?.includes(code)
    );
  }

  /**
   * Parse transaction receipt
   */
  static parseReceipt(receipt) {
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      from: receipt.from,
      to: receipt.to,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.gasPrice ? receipt.gasPrice.toString() : null,
      status: receipt.status,
      contractAddress: receipt.contractAddress,
      logs: receipt.logs.map(log => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
        logIndex: log.index,
      })),
    };
  }

  /**
   * Extract event from receipt
   */
  static extractEvent(receipt, eventName, contractInterface) {
    const event = receipt.logs
      .map(log => {
        try {
          return contractInterface.parseLog({
            topics: log.topics,
            data: log.data,
          });
        } catch (e) {
          return null;
        }
      })
      .find(parsedLog => parsedLog && parsedLog.name === eventName);

    return event;
  }

  /**
   * Get transaction status description
   */
  static getTxStatusDescription(status) {
    const descriptions = {
      pending: 'Transaction submitted, waiting for confirmation',
      queued: 'Transaction queued for processing',
      mining: 'Transaction being mined',
      confirmed: 'Transaction confirmed on blockchain',
      failed: 'Transaction failed',
      replaced: 'Transaction replaced by another transaction',
      cancelled: 'Transaction cancelled',
    };

    return descriptions[status] || 'Unknown status';
  }

  /**
   * Calculate optimal gas price
   */
  static calculateOptimalGasPrice(baseGasPrice, priorityLevel = 'standard') {
    const multipliers = {
      slow: 1.0,
      standard: 1.2,
      fast: 1.5,
      urgent: 2.0,
    };

    const multiplier = multipliers[priorityLevel] || 1.2;
    return BigInt(Math.floor(Number(baseGasPrice) * multiplier));
  }

  /**
   * Validate transaction options
   */
  static validateTxOptions(options) {
    const validated = {};

    if (options.gasLimit) {
      validated.gasLimit = BigInt(options.gasLimit);
    }

    if (options.gasPrice) {
      validated.gasPrice = BigInt(options.gasPrice);
    }

    if (options.maxFeePerGas) {
      validated.maxFeePerGas = BigInt(options.maxFeePerGas);
    }

    if (options.maxPriorityFeePerGas) {
      validated.maxPriorityFeePerGas = BigInt(options.maxPriorityFeePerGas);
    }

    if (options.nonce !== undefined) {
      validated.nonce = Number(options.nonce);
    }

    if (options.value) {
      validated.value = BigInt(options.value);
    }

    return validated;
  }

  /**
   * Generate random nonce
   */
  static generateNonce() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Estimate time to confirmation
   */
  static estimateConfirmationTime(blockTime, confirmations) {
    return blockTime * confirmations * 1000; // in milliseconds
  }

  /**
   * Format gas information
   */
  static formatGasInfo(gasUsed, gasPrice, gasLimit = null) {
    const gasPriceGwei = this.weiToGwei(gasPrice);
    const costEth = this.calculateTxCost(gasUsed, gasPrice);

    const info = {
      gasUsed: gasUsed.toString(),
      gasPrice: gasPrice.toString(),
      gasPriceGwei: parseFloat(gasPriceGwei).toFixed(2),
      costEth: parseFloat(costEth).toFixed(6),
    };

    if (gasLimit) {
      info.gasLimit = gasLimit.toString();
      info.gasUsedPercentage = ((Number(gasUsed) / Number(gasLimit)) * 100).toFixed(2) + '%';
    }

    return info;
  }

  /**
   * Get block explorer URL
   */
  static getExplorerUrl(network, type, identifier) {
    const explorers = {
      localhost: null,
      sepolia: 'https://sepolia.etherscan.io',
      mainnet: 'https://etherscan.io',
    };

    const baseUrl = explorers[network];
    if (!baseUrl) {
      return null;
    }

    const paths = {
      tx: 'tx',
      address: 'address',
      block: 'block',
      token: 'token',
    };

    return `${baseUrl}/${paths[type]}/${identifier}`;
  }
}

module.exports = BlockchainHelpers;
