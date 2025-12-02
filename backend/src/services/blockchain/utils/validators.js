/**
 * Blockchain Validation Utilities
 * Provides validation functions for blockchain-related data
 */

const { ethers } = require('ethers');
const { ValidationError } = require('./errors');

class BlockchainValidator {
  /**
   * Validate Ethereum address
   */
  static isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate and checksum address
   */
  static validateAddress(address, fieldName = 'address') {
    if (!address) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (!this.isValidAddress(address)) {
      throw new ValidationError(`Invalid ${fieldName}: ${address}`);
    }

    return ethers.getAddress(address); // Returns checksummed address
  }

  /**
   * Validate transaction hash
   */
  static isValidTxHash(hash) {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Validate transaction hash
   */
  static validateTxHash(hash, fieldName = 'transaction hash') {
    if (!hash) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (!this.isValidTxHash(hash)) {
      throw new ValidationError(`Invalid ${fieldName}: ${hash}`);
    }

    return hash.toLowerCase();
  }

  /**
   * Validate bytes32 (credential ID, document hash)
   */
  static isValidBytes32(value) {
    return /^0x[a-fA-F0-9]{64}$/.test(value);
  }

  /**
   * Validate bytes32
   */
  static validateBytes32(value, fieldName = 'bytes32 value') {
    if (!value) {
      throw new ValidationError(`${fieldName} is required`);
    }

    if (!this.isValidBytes32(value)) {
      throw new ValidationError(`Invalid ${fieldName}: ${value}`);
    }

    return value.toLowerCase();
  }

  /**
   * Validate private key
   */
  static isValidPrivateKey(privateKey) {
    if (typeof privateKey !== 'string') {
      return false;
    }

    const normalized = privateKey.trim();
    if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
      return false;
    }

    try {
      new ethers.Wallet(normalized);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate private key
   */
  static validatePrivateKey(privateKey) {
    if (!privateKey) {
      throw new ValidationError('Private key is required');
    }

    if (!this.isValidPrivateKey(privateKey)) {
      throw new ValidationError('Invalid private key format');
    }

    return privateKey.trim();
  }

  /**
   * Validate network name
   */
  static validateNetwork(network, allowedNetworks = ['localhost', 'sepolia', 'mainnet']) {
    if (!network) {
      throw new ValidationError('Network is required');
    }

    if (!allowedNetworks.includes(network)) {
      throw new ValidationError(
        `Invalid network: ${network}. Allowed: ${allowedNetworks.join(', ')}`
      );
    }

    return network;
  }

  /**
   * Validate gas limit
   */
  static validateGasLimit(gasLimit) {
    const limit = BigInt(gasLimit);

    if (limit <= 0n) {
      throw new ValidationError('Gas limit must be greater than 0');
    }

    if (limit > 30000000n) { // Block gas limit
      throw new ValidationError('Gas limit exceeds block gas limit');
    }

    return limit;
  }

  /**
   * Validate gas price (in wei)
   */
  static validateGasPrice(gasPrice) {
    const price = BigInt(gasPrice);

    if (price < 0n) {
      throw new ValidationError('Gas price cannot be negative');
    }

    return price;
  }

  /**
   * Validate credential type
   */
  static validateCredentialType(type) {
    const validTypes = [1, 2]; // 1 = Student ID, 2 = KYC

    if (!validTypes.includes(Number(type))) {
      throw new ValidationError(
        `Invalid credential type: ${type}. Valid types: ${validTypes.join(', ')}`
      );
    }

    return Number(type);
  }

  /**
   * Validate document hash (SHA-256)
   */
  static validateDocumentHash(hash) {
    if (!hash) {
      throw new ValidationError('Document hash is required');
    }

    // SHA-256 hash without 0x prefix (64 hex characters)
    if (!/^[a-fA-F0-9]{64}$/.test(hash)) {
      throw new ValidationError(`Invalid document hash format: ${hash}`);
    }

    return hash.toLowerCase();
  }

  /**
   * Convert document hash to bytes32 format
   */
  static hashToBytes32(hash) {
    const validatedHash = this.validateDocumentHash(hash);
    return '0x' + validatedHash;
  }

  /**
   * Validate URL
   */
  static validateUrl(url, fieldName = 'URL') {
    if (!url) {
      throw new ValidationError(`${fieldName} is required`);
    }

    try {
      new URL(url);
      return url;
    } catch (error) {
      throw new ValidationError(`Invalid ${fieldName}: ${url}`);
    }
  }

  /**
   * Validate positive integer
   */
  static validatePositiveInteger(value, fieldName = 'value') {
    const num = Number(value);

    if (!Number.isInteger(num) || num <= 0) {
      throw new ValidationError(`${fieldName} must be a positive integer`);
    }

    return num;
  }

  /**
   * Validate amount (in wei)
   */
  static validateAmount(amount, fieldName = 'amount') {
    try {
      const amt = BigInt(amount);

      if (amt < 0n) {
        throw new ValidationError(`${fieldName} cannot be negative`);
      }

      return amt;
    } catch (error) {
      throw new ValidationError(`Invalid ${fieldName}: ${amount}`);
    }
  }

  /**
   * Validate ABI
   */
  static validateABI(abi) {
    if (!Array.isArray(abi)) {
      throw new ValidationError('ABI must be an array');
    }

    if (abi.length === 0) {
      throw new ValidationError('ABI cannot be empty');
    }

    return abi;
  }

  /**
   * Sanitize transaction options
   */
  static sanitizeTxOptions(options = {}) {
    const sanitized = {};

    if (options.gasLimit) {
      sanitized.gasLimit = this.validateGasLimit(options.gasLimit);
    }

    if (options.gasPrice) {
      sanitized.gasPrice = this.validateGasPrice(options.gasPrice);
    }

    if (options.maxFeePerGas) {
      sanitized.maxFeePerGas = this.validateGasPrice(options.maxFeePerGas);
    }

    if (options.maxPriorityFeePerGas) {
      sanitized.maxPriorityFeePerGas = this.validateGasPrice(options.maxPriorityFeePerGas);
    }

    if (options.nonce !== undefined) {
      sanitized.nonce = this.validatePositiveInteger(options.nonce, 'nonce');
    }

    if (options.value) {
      sanitized.value = this.validateAmount(options.value, 'transaction value');
    }

    return sanitized;
  }
}

module.exports = BlockchainValidator;
