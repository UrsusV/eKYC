/**
 * Blockchain Service Module
 * Exports all blockchain-related services and utilities
 */

// Main service
const CredentialService = require('./CredentialService');

// Core components
const BlockchainProvider = require('./core/BlockchainProvider');

// Managers
const WalletManager = require('./managers/WalletManager');
const ContractManager = require('./managers/ContractManager');
const TransactionManager = require('./managers/TransactionManager');
const EventListener = require('./managers/EventListener');
const TransactionQueue = require('./managers/TransactionQueue');

// Utilities
const BlockchainValidator = require('./utils/validators');
const BlockchainHelpers = require('./utils/helpers');
const { createLogger, logger } = require('./utils/logger');
const constants = require('./utils/constants');
const errors = require('./utils/errors');

// Export singleton instance creator
let credentialServiceInstance = null;

const getCredentialService = (config = {}) => {
  if (!credentialServiceInstance) {
    credentialServiceInstance = new CredentialService(config);
  }
  return credentialServiceInstance;
};

const resetCredentialService = () => {
  if (credentialServiceInstance) {
    credentialServiceInstance.shutdown();
    credentialServiceInstance = null;
  }
};

module.exports = {
  // Main service
  CredentialService,
  getCredentialService,
  resetCredentialService,

  // Core components
  BlockchainProvider,

  // Managers
  WalletManager,
  ContractManager,
  TransactionManager,
  EventListener,
  TransactionQueue,

  // Utilities
  BlockchainValidator,
  BlockchainHelpers,
  createLogger,
  logger,
  constants,
  errors,

  // Constants shortcuts
  NETWORKS: constants.NETWORKS,
  CREDENTIAL_TYPES: constants.CREDENTIAL_TYPES,
  TX_STATUS: constants.TX_STATUS,
  GAS: constants.GAS,
  RETRY: constants.RETRY,
  EVENTS: constants.EVENTS,
  QUEUE: constants.QUEUE,
};
