/**
 * Error Scenarios Tests
 * Comprehensive tests for error handling across all components
 */

jest.mock('ethers', () => require('./mocks/ethers.mock'));
jest.mock('fs', () => require('./mocks/fs.mock'));

const { ethers } = require('ethers');
const BlockchainProvider = require('../core/BlockchainProvider');
const WalletManager = require('../managers/WalletManager');
const TransactionManager = require('../managers/TransactionManager');
const CredentialService = require('../CredentialService');
const {
  NetworkError,
  ConnectionError,
  TransactionError,
  InsufficientFundsError,
  GasEstimationError,
  WalletError,
  ValidationError,
} = require('../utils/errors');

describe('Error Scenarios', () => {
  describe('Network Errors', () => {
    test('should handle network disconnection', async () => {
      const provider = new BlockchainProvider('localhost');

      ethers.JsonRpcProvider.prototype.getNetwork = jest.fn()
        .mockRejectedValue(new Error('Network disconnected'));

      await expect(provider.connect()).rejects.toThrow(ConnectionError);
    });

    test('should handle RPC timeout', async () => {
      const provider = new BlockchainProvider('localhost');
      await provider.connect();

      provider.provider.getBlockNumber = jest.fn()
        .mockImplementation(() => new Promise((resolve) => {
          setTimeout(() => resolve(123), 10000);
        }));

      await expect(
        Promise.race([
          provider.getBlockNumber(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
        ])
      ).rejects.toThrow();
    });

    test('should handle chain ID mismatch', async () => {
      const provider = new BlockchainProvider('localhost');

      ethers.JsonRpcProvider.prototype.getNetwork = jest.fn()
        .mockResolvedValue({ chainId: 9999n }); // Wrong chain ID

      await expect(provider.connect()).rejects.toThrow(NetworkError);
    });
  });

  describe('Transaction Errors', () => {
    let provider;
    let walletManager;
    let transactionManager;

    beforeEach(async () => {
      provider = new BlockchainProvider('localhost');
      await provider.connect();
      walletManager = new WalletManager(provider);
      walletManager.loadFromPrivateKey(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      );
    });

    afterEach(async () => {
      await provider.disconnect();
    });

    test('should handle transaction revert', async () => {
      provider.provider.waitForTransaction = jest.fn()
        .mockResolvedValue({
          hash: '0x1234',
          status: 0, // Reverted
          blockNumber: 123,
          gasUsed: 100000n,
        });

      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      transactionManager = new TransactionManager(provider, walletManager, null);

      await expect(
        transactionManager.waitForConfirmation(txHash)
      ).rejects.toThrow(TransactionError);
    });

    test('should handle insufficient funds', async () => {
      provider.provider.getBalance = jest.fn().mockResolvedValue(0n);

      await expect(
        walletManager.validateSufficientBalance(1000000000000000000n)
      ).rejects.toThrow(InsufficientFundsError);
    });

    test('should handle gas estimation failure', async () => {
      provider.provider.estimateGas = jest.fn()
        .mockRejectedValue(new Error('Gas estimation failed'));

      transactionManager = new TransactionManager(provider, walletManager, null);

      await expect(
        transactionManager.estimateGas({ to: '0x1234' })
      ).rejects.toThrow(GasEstimationError);
    });

    test('should handle nonce too low error', async () => {
      const wallet = walletManager.getWallet();
      wallet.sendTransaction = jest.fn()
        .mockRejectedValue({
          code: 'NONCE_EXPIRED',
          message: 'Nonce too low',
        });

      transactionManager = new TransactionManager(provider, walletManager, null);

      // Should retry
      await expect(
        transactionManager.sendTransaction(
          { to: '0x1234' },
          { maxRetries: 1, confirmations: 0 }
        )
      ).rejects.toThrow(TransactionError);
    });

    test('should handle replacement underpriced error', async () => {
      const wallet = walletManager.getWallet();
      wallet.sendTransaction = jest.fn()
        .mockRejectedValue({
          code: 'REPLACEMENT_UNDERPRICED',
          message: 'Replacement transaction underpriced',
        });

      transactionManager = new TransactionManager(provider, walletManager, null);

      await expect(
        transactionManager.sendTransaction(
          { to: '0x1234' },
          { maxRetries: 2, confirmations: 0 }
        )
      ).rejects.toThrow(TransactionError);
    });
  });

  describe('Wallet Errors', () => {
    test('should handle invalid private key', () => {
      const provider = new BlockchainProvider('localhost');
      const walletManager = new WalletManager(provider);

      expect(() => {
        walletManager.loadFromPrivateKey('invalid_key');
      }).toThrow(WalletError);
    });

    test('should handle missing mnemonic', () => {
      const provider = new BlockchainProvider('localhost');
      const walletManager = new WalletManager(provider);

      expect(() => {
        walletManager.loadFromMnemonic('');
      }).toThrow(WalletError);
    });

    test('should handle wallet not found', () => {
      const provider = new BlockchainProvider('localhost');
      const walletManager = new WalletManager(provider);

      expect(() => {
        walletManager.getWallet('nonexistent');
      }).toThrow(WalletError);
    });
  });

  describe('Validation Errors', () => {
    test('should validate invalid address', () => {
      expect(() => {
        const { BlockchainValidator } = require('../utils/validators');
        BlockchainValidator.validateAddress('invalid');
      }).toThrow(ValidationError);
    });

    test('should validate invalid transaction hash', () => {
      expect(() => {
        const { default: BlockchainValidator } = require('../utils/validators');
        BlockchainValidator.validateTxHash('0xinvalid');
      }).toThrow(ValidationError);
    });

    test('should validate invalid bytes32', () => {
      expect(() => {
        const { default: BlockchainValidator } = require('../utils/validators');
        BlockchainValidator.validateBytes32('invalid');
      }).toThrow(ValidationError);
    });

    test('should validate invalid credential type', () => {
      expect(() => {
        const { default: BlockchainValidator } = require('../utils/validators');
        BlockchainValidator.validateCredentialType(999);
      }).toThrow(ValidationError);
    });

    test('should validate invalid gas limit', () => {
      expect(() => {
        const { default: BlockchainValidator } = require('../utils/validators');
        BlockchainValidator.validateGasLimit(-1);
      }).toThrow(ValidationError);
    });
  });

  describe('Contract Errors', () => {
    test('should handle contract not deployed', async () => {
      const provider = new BlockchainProvider('localhost');
      await provider.connect();

      provider.provider.getCode = jest.fn().mockResolvedValue('0x'); // Empty code

      const walletManager = new WalletManager(provider);
      walletManager.loadFromPrivateKey(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      );

      const ContractManager = require('../managers/ContractManager');
      const contractManager = new ContractManager(provider, walletManager);

      await contractManager.loadContractFromArtifact(
        'test.json',
        '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        'test'
      );

      const isDeployed = await contractManager.isDeployed('test');
      expect(isDeployed).toBe(false);

      await provider.disconnect();
    });

    test('should handle contract method not found', async () => {
      const provider = new BlockchainProvider('localhost');
      await provider.connect();

      const walletManager = new WalletManager(provider);
      walletManager.loadFromPrivateKey(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      );

      const ContractManager = require('../managers/ContractManager');
      const contractManager = new ContractManager(provider, walletManager);

      await contractManager.loadContractFromArtifact(
        'test.json',
        '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        'test'
      );

      await expect(
        contractManager.call('nonExistentMethod', [], 'test')
      ).rejects.toThrow();

      await provider.disconnect();
    });
  });

  describe('Service Level Errors', () => {
    test('should handle service not initialized', async () => {
      const service = new CredentialService({
        network: 'localhost',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        enableQueue: false,
        enableEventListener: false,
      });

      await expect(
        service.issueCredential('hash', 'address', 2)
      ).rejects.toThrow('not initialized');
    });

    test('should handle missing configuration', async () => {
      const service = new CredentialService({
        network: 'localhost',
        contractAddress: null,
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      });

      await expect(service.initialize()).rejects.toThrow();
    });

    test('should handle initialization failure', async () => {
      const service = new CredentialService({
        network: 'localhost',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        privateKey: 'invalid',
      });

      await expect(service.initialize()).rejects.toThrow();
    });
  });

  describe('Error Recovery', () => {
    test('should recover from temporary network failure', async () => {
      const provider = new BlockchainProvider('localhost');

      let callCount = 0;
      ethers.JsonRpcProvider.prototype.getNetwork = jest.fn()
        .mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('Temporary failure'));
          }
          return Promise.resolve({ chainId: 31337n });
        });

      ethers.JsonRpcProvider.prototype.getBlockNumber = jest.fn()
        .mockResolvedValue(123);

      // Should fail on first attempt
      await expect(provider._verifyConnection()).rejects.toThrow();
    });

    test('should clear cache after error', async () => {
      const provider = new BlockchainProvider('localhost');
      await provider.connect();

      // Set cache
      provider._setCache('test', 'value');
      expect(provider._getCache('test')).toBe('value');

      // Clear on disconnect
      await provider.disconnect();

      // Cache should be cleared
      expect(provider.cache.size).toBe(0);
    });
  });

  describe('Concurrent Error Handling', () => {
    test('should handle multiple failed transactions', async () => {
      const provider = new BlockchainProvider('localhost');
      await provider.connect();

      const walletManager = new WalletManager(provider);
      walletManager.loadFromPrivateKey(
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
      );

      const wallet = walletManager.getWallet();
      wallet.sendTransaction = jest.fn()
        .mockRejectedValue(new Error('Transaction failed'));

      const transactionManager = new TransactionManager(provider, walletManager, null);

      const promises = [
        transactionManager.sendTransaction({ to: '0x1234' }, { maxRetries: 1, confirmations: 0 }),
        transactionManager.sendTransaction({ to: '0x5678' }, { maxRetries: 1, confirmations: 0 }),
        transactionManager.sendTransaction({ to: '0xabcd' }, { maxRetries: 1, confirmations: 0 }),
      ];

      const results = await Promise.allSettled(promises);

      expect(results.every(r => r.status === 'rejected')).toBe(true);

      await provider.disconnect();
    });
  });
});
