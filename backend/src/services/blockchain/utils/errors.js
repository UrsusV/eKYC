/**
 * Custom Blockchain Error Classes
 * Provides specific error types for different blockchain operations
 */

class BlockchainError extends Error {
  constructor(message, code = 'BLOCKCHAIN_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

class NetworkError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'NETWORK_ERROR', details);
  }
}

class ConnectionError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'CONNECTION_ERROR', details);
  }
}

class ContractError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'CONTRACT_ERROR', details);
  }
}

class TransactionError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'TRANSACTION_ERROR', details);
  }
}

class GasEstimationError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'GAS_ESTIMATION_ERROR', details);
  }
}

class WalletError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'WALLET_ERROR', details);
  }
}

class EventListenerError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'EVENT_LISTENER_ERROR', details);
  }
}

class QueueError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'QUEUE_ERROR', details);
  }
}

class ValidationError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

class TimeoutError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'TIMEOUT_ERROR', details);
  }
}

class InsufficientFundsError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'INSUFFICIENT_FUNDS', details);
  }
}

class NonceError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'NONCE_ERROR', details);
  }
}

class RevertError extends BlockchainError {
  constructor(message, details = {}) {
    super(message, 'REVERT_ERROR', details);
  }
}

module.exports = {
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
};
