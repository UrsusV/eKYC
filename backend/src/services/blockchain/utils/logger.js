/**
 * Blockchain Service Logger
 * Provides structured logging for blockchain operations
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class BlockchainLogger {
  constructor(serviceName = 'BlockchainService') {
    this.serviceName = serviceName;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  _formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      service: this.serviceName,
      level,
      message,
    };

    if (Object.keys(data).length > 0) {
      baseLog.data = data;
    }

    return baseLog;
  }

  _getColorForLevel(level) {
    const colorMap = {
      error: colors.red,
      warn: colors.yellow,
      info: colors.blue,
      debug: colors.cyan,
      success: colors.green,
    };
    return colorMap[level] || colors.reset;
  }

  _log(level, message, data = {}) {
    const logData = this._formatMessage(level, message, data);

    if (this.isProduction) {
      // Production: JSON format for log aggregation
      console.log(JSON.stringify(logData));
    } else {
      // Development: Colored, human-readable format
      const color = this._getColorForLevel(level);
      const levelStr = level.toUpperCase().padEnd(7);
      const dataStr = Object.keys(data).length > 0
        ? '\n' + JSON.stringify(data, null, 2)
        : '';

      console.log(
        `${colors.dim}[${logData.timestamp}]${colors.reset} ` +
        `${color}${levelStr}${colors.reset} ` +
        `${colors.bright}${this.serviceName}${colors.reset} ` +
        `${message}${dataStr}`
      );
    }
  }

  error(message, error = null, additionalData = {}) {
    const data = { ...additionalData };

    if (error) {
      data.error = {
        message: error.message,
        code: error.code,
        stack: error.stack,
        ...(error.details && { details: error.details }),
      };
    }

    this._log('error', message, data);
  }

  warn(message, data = {}) {
    this._log('warn', message, data);
  }

  info(message, data = {}) {
    this._log('info', message, data);
  }

  debug(message, data = {}) {
    if (!this.isProduction || process.env.DEBUG === 'true') {
      this._log('debug', message, data);
    }
  }

  success(message, data = {}) {
    this._log('success', message, data);
  }

  transaction(txHash, operation, data = {}) {
    this.info(`Transaction ${operation}`, {
      txHash,
      operation,
      ...data,
    });
  }

  contract(method, contractAddress, data = {}) {
    this.info(`Contract method: ${method}`, {
      method,
      contractAddress,
      ...data,
    });
  }

  gas(operation, gasUsed, gasLimit, data = {}) {
    this.debug(`Gas consumption: ${operation}`, {
      operation,
      gasUsed: gasUsed.toString(),
      gasLimit: gasLimit?.toString(),
      percentage: gasLimit ? ((Number(gasUsed) / Number(gasLimit)) * 100).toFixed(2) + '%' : 'N/A',
      ...data,
    });
  }

  network(network, status, data = {}) {
    this.info(`Network ${status}: ${network}`, {
      network,
      status,
      ...data,
    });
  }

  wallet(address, operation, data = {}) {
    this.info(`Wallet ${operation}`, {
      address,
      operation,
      ...data,
    });
  }

  event(eventName, contractAddress, data = {}) {
    this.info(`Event emitted: ${eventName}`, {
      eventName,
      contractAddress,
      ...data,
    });
  }
}

// Create singleton instances for different services
const createLogger = (serviceName) => new BlockchainLogger(serviceName);

module.exports = {
  BlockchainLogger,
  createLogger,
  // Default logger instance
  logger: new BlockchainLogger(),
};
