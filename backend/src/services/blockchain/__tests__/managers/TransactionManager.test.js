/**
 * TransactionManager Tests
 * Tests transaction execution, gas estimation, and retry logic
 */

jest.mock('ethers', () => require('../mocks/ethers.mock'));
jest.mock('fs', () => require('../mocks/fs.mock'));
jest.mock('fs/promises', () => require('../mocks/fs.mock'));

const TransactionManager = require('../../managers/TransactionManager');
const BlockchainProvider = require('../../core/BlockchainProvider');
const WalletManager = require('../../managers/WalletManager');
const ContractManager = require('../../managers/ContractManager');
const {
  TransactionError,
  GasEstimationError,
  NonceError,
  TimeoutError,
} = require('../../utils/errors');
const { createMockTransaction, createMockReceipt } = require('../mocks/ethers.mock');

describe('TransactionManager', () => {
  let provider;
  let walletManager;
  let contractManager;
  let transactionManager;

  beforeEach(async () => {
    provider = new BlockchainProvider('localhost');
    await provider.connect();

    walletManager = new WalletManager(provider);
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    walletManager.loadFromPrivateKey(privateKey);

    contractManager = new ContractManager(provider, walletManager);
    await contractManager.loadContractFromArtifact(
      'test.json',
      '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      'testContract'
    );

    transactionManager = new TransactionManager(provider, walletManager, contractManager);
  }, 30000);

  afterEach(async () => {
    await provider.disconnect();
    jest.clearAllMocks();
  });

  describe('Gas Estimation', () => {
    test('should estimate gas for transaction', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        data: '0x',
      };

      const gasEstimate = await transactionManager.estimateGas(tx);

      expect(gasEstimate).toBe(120000n); // 100000 * 1.2 buffer
      expect(typeof gasEstimate).toBe('bigint');
    });

    test('should apply custom buffer to gas estimation', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        data: '0x',
      };

      const gasEstimate = await transactionManager.estimateGas(tx, 1.5);

      expect(gasEstimate).toBe(150000n); // 100000 * 1.5
    });

    test('should throw GasEstimationError on failure', async () => {
      const tx = { to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' };

      provider.provider.estimateGas = jest.fn()
        .mockRejectedValue(new Error('Estimation failed'));

      await expect(transactionManager.estimateGas(tx))
        .rejects.toThrow(GasEstimationError);
    });
  });

  describe('Gas Price Optimization', () => {
    test('should get optimal gas price - standard priority', async () => {
      const gasPricing = await transactionManager.getOptimalGasPrice('standard');

      expect(gasPricing.type).toBe('eip1559');
      expect(gasPricing.maxFeePerGas).toBeDefined();
      expect(gasPricing.maxPriorityFeePerGas).toBeDefined();
      expect(typeof gasPricing.maxFeePerGas).toBe('bigint');
    });

    test('should get optimal gas price - fast priority', async () => {
      const gasPricing = await transactionManager.getOptimalGasPrice('fast');

      expect(gasPricing.maxFeePerGas).toBeGreaterThan(0n);
    });

    test('should get optimal gas price - slow priority', async () => {
      const gasPricing = await transactionManager.getOptimalGasPrice('slow');

      expect(gasPricing.maxFeePerGas).toBeGreaterThan(0n);
    });

    test('should handle legacy gas price', async () => {
      // Mock legacy network (no EIP-1559)
      provider.provider.getFeeData = jest.fn().mockResolvedValue({
        gasPrice: 1000000000n,
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      });

      const gasPricing = await transactionManager.getOptimalGasPrice('standard');

      expect(gasPricing.type).toBe('legacy');
      expect(gasPricing.gasPrice).toBeDefined();
    });
  });

  describe('Nonce Management', () => {
    test('should get next nonce from blockchain', async () => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

      const nonce = await transactionManager.getNextNonce(address, false);

      expect(nonce).toBe(5);
      expect(typeof nonce).toBe('number');
    });

    test('should use cached nonce when available', async () => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const spy = jest.spyOn(provider, 'getTransactionCount');

      const nonce1 = await transactionManager.getNextNonce(address);
      const nonce2 = await transactionManager.getNextNonce(address);

      expect(nonce1).toBe(nonce2);
      expect(spy).toHaveBeenCalledTimes(1); // Only called once
    });

    test('should increment cached nonce', async () => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

      await transactionManager.getNextNonce(address);
      transactionManager.incrementNonce(address);

      const cachedNonce = transactionManager.nonceCache.get(address);
      expect(cachedNonce).toBe(6);
    });

    test('should clear nonce cache for specific address', async () => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

      await transactionManager.getNextNonce(address);
      expect(transactionManager.nonceCache.has(address)).toBe(true);

      transactionManager.clearNonceCache(address);
      expect(transactionManager.nonceCache.has(address)).toBe(false);
    });

    test('should clear all nonce cache', async () => {
      await transactionManager.getNextNonce('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      await transactionManager.getNextNonce('0x70997970C51812dc3A010C7d01b50e0d17dc79C8');

      transactionManager.clearNonceCache();

      expect(transactionManager.nonceCache.size).toBe(0);
    });
  });

  describe('Transaction Preparation', () => {
    test('should prepare transaction with all parameters', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        data: '0x',
      };

      const prepared = await transactionManager.prepareTransaction(tx, {
        from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        priorityLevel: 'standard',
      });

      expect(prepared.to).toBe(tx.to);
      expect(prepared.gasLimit).toBeDefined();
      expect(prepared.maxFeePerGas).toBeDefined();
      expect(prepared.maxPriorityFeePerGas).toBeDefined();
      expect(prepared.nonce).toBe(5);
    });

    test('should use provided gas limit', async () => {
      const tx = { to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' };

      const prepared = await transactionManager.prepareTransaction(tx, {
        gasLimit: 200000,
      });

      expect(prepared.gasLimit).toBe(200000n);
    });

    test('should use provided nonce', async () => {
      const tx = { to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' };

      const prepared = await transactionManager.prepareTransaction(tx, {
        nonce: 10,
      });

      expect(prepared.nonce).toBe(10);
    });
  });

  describe('Transaction Retry Logic', () => {
    test('should send transaction successfully on first attempt', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 1000000000000000000n,
      };

      const result = await transactionManager.sendTransaction(tx, {
        confirmations: 1,
      });

      expect(result.tx).toBeDefined();
      expect(result.receipt).toBeDefined();
      expect(result.tx.hash).toBeDefined();
    });

    test('should retry transaction on retryable error', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 1000000000000000000n,
      };

      const wallet = walletManager.getWallet();
      const sendSpy = jest.spyOn(wallet, 'sendTransaction')
        .mockRejectedValueOnce({ code: 'NONCE_EXPIRED', message: 'Nonce expired' })
        .mockResolvedValue(createMockTransaction());

      const result = await transactionManager.sendTransaction(tx, {
        maxRetries: 3,
        confirmations: 0,
      });

      expect(sendSpy).toHaveBeenCalledTimes(2); // Failed once, succeeded on retry
      expect(result.tx).toBeDefined();
    });

    test('should fail after max retries', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 1000000000000000000n,
      };

      const wallet = walletManager.getWallet();
      jest.spyOn(wallet, 'sendTransaction')
        .mockRejectedValue({ code: 'NETWORK_ERROR', message: 'Network error' });

      await expect(
        transactionManager.sendTransaction(tx, {
          maxRetries: 2,
          confirmations: 0,
        })
      ).rejects.toThrow(TransactionError);
    });

    test('should not retry on non-retryable error', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 1000000000000000000n,
      };

      const wallet = walletManager.getWallet();
      const sendSpy = jest.spyOn(wallet, 'sendTransaction')
        .mockRejectedValue(new Error('Insufficient funds'));

      await expect(
        transactionManager.sendTransaction(tx, {
          maxRetries: 3,
          confirmations: 0,
        })
      ).rejects.toThrow();

      expect(sendSpy).toHaveBeenCalledTimes(1); // No retry
    });

    test('should clear nonce cache on retry', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 1000000000000000000n,
      };

      const wallet = walletManager.getWallet();
      jest.spyOn(wallet, 'sendTransaction')
        .mockRejectedValueOnce({ code: 'NONCE_EXPIRED', message: 'Nonce expired' })
        .mockResolvedValue(createMockTransaction());

      const clearSpy = jest.spyOn(transactionManager, 'clearNonceCache');

      await transactionManager.sendTransaction(tx, {
        maxRetries: 3,
        confirmations: 0,
      });

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('Transaction Confirmation', () => {
    test('should wait for transaction confirmation', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const receipt = await transactionManager.waitForConfirmation(txHash, 1);

      expect(receipt).toBeDefined();
      expect(receipt.status).toBe(1);
    });

    test('should wait for multiple confirmations', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const receipt = await transactionManager.waitForConfirmation(txHash, 3);

      expect(receipt).toBeDefined();
    });

    test('should timeout waiting for confirmation', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      provider.provider.waitForTransaction = jest.fn()
        .mockImplementation(() => new Promise(resolve => {
          setTimeout(() => resolve(null), 10000);
        }));

      await expect(
        transactionManager.waitForConfirmation(txHash, 1, 100)
      ).rejects.toThrow();
    });

    test('should throw error on reverted transaction', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      provider.provider.waitForTransaction = jest.fn()
        .mockResolvedValue(createMockReceipt({ status: 0 })); // Reverted

      await expect(
        transactionManager.waitForConfirmation(txHash)
      ).rejects.toThrow(TransactionError);
    });
  });

  describe('Contract Method Execution', () => {
    test('should execute contract method successfully', async () => {
      const result = await transactionManager.executeContractMethod(
        'testContract',
        'issueCredential',
        ['0xabcd1234', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 2],
        { confirmations: 1 }
      );

      expect(result.tx).toBeDefined();
      expect(result.receipt).toBeDefined();
    });

    test('should estimate gas before execution', async () => {
      const estimateSpy = jest.spyOn(contractManager, 'estimateGas');

      await transactionManager.executeContractMethod(
        'testContract',
        'issueCredential',
        ['0xabcd1234', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', 2],
        { confirmations: 1 }
      );

      expect(estimateSpy).toHaveBeenCalled();
    });
  });

  describe('Transaction Cancellation', () => {
    test('should cancel pending transaction', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Track a transaction first
      transactionManager._trackTransaction(txHash, {
        transaction: { nonce: 5 },
        walletId: 'default',
        status: 'pending',
      });

      const cancelTx = await transactionManager.cancelTransaction(txHash);

      expect(cancelTx).toBeDefined();
      expect(cancelTx.hash).toBeDefined();
    });

    test('should throw error for unknown transaction', async () => {
      const txHash = '0x9999999999999999999999999999999999999999999999999999999999999999';

      await expect(
        transactionManager.cancelTransaction(txHash)
      ).rejects.toThrow(TransactionError);
    });
  });

  describe('Transaction Status', () => {
    test('should get status of confirmed transaction', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const status = await transactionManager.getTransactionStatus(txHash);

      expect(status.found).toBe(true);
      expect(status.status).toBe('confirmed');
      expect(status.tx).toBeDefined();
      expect(status.receipt).toBeDefined();
    });

    test('should get status of pending transaction', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      provider.provider.getTransactionReceipt = jest.fn().mockResolvedValue(null);

      const status = await transactionManager.getTransactionStatus(txHash);

      expect(status.status).toBe('pending');
    });

    test('should return not found for non-existent transaction', async () => {
      const txHash = '0x9999999999999999999999999999999999999999999999999999999999999999';

      provider.provider.getTransaction = jest.fn().mockResolvedValue(null);

      const status = await transactionManager.getTransactionStatus(txHash);

      expect(status.found).toBe(false);
    });
  });

  describe('Transaction Tracking', () => {
    test('should track transaction', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      transactionManager._trackTransaction(txHash, {
        status: 'pending',
        walletId: 'default',
      });

      expect(transactionManager.pendingTransactions.has(txHash)).toBe(true);
    });

    test('should update tracked transaction', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      transactionManager._trackTransaction(txHash, { status: 'pending' });
      transactionManager._updateTransaction(txHash, { status: 'confirmed' });

      const tracked = transactionManager.pendingTransactions.get(txHash);
      expect(tracked.status).toBe('confirmed');
    });

    test('should remove tracked transaction', () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      transactionManager._trackTransaction(txHash, { status: 'pending' });

      const removed = transactionManager.removeTrackedTransaction(txHash);

      expect(removed).toBe(true);
      expect(transactionManager.pendingTransactions.has(txHash)).toBe(false);
    });

    test('should get all pending transactions', () => {
      transactionManager._trackTransaction('0x1111', { status: 'pending' });
      transactionManager._trackTransaction('0x2222', { status: 'confirmed' });
      transactionManager._trackTransaction('0x3333', { status: 'mining' });

      const pending = transactionManager.getPendingTransactions();

      expect(pending).toHaveLength(2); // Only pending and mining
    });

    test('should clear completed transactions', () => {
      transactionManager._trackTransaction('0x1111', { status: 'pending' });
      transactionManager._trackTransaction('0x2222', { status: 'confirmed' });
      transactionManager._trackTransaction('0x3333', { status: 'failed' });

      const cleared = transactionManager.clearCompletedTransactions();

      expect(cleared).toBe(2); // Confirmed and failed
      expect(transactionManager.pendingTransactions.size).toBe(1); // Only pending left
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const tx = { to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' };

      provider.provider.estimateGas = jest.fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(transactionManager.estimateGas(tx))
        .rejects.toThrow(GasEstimationError);
    });

    test('should handle nonce errors', async () => {
      const address = 'invalid-address';

      await expect(
        transactionManager.getNextNonce(address)
      ).rejects.toThrow();
    });
  });
});
