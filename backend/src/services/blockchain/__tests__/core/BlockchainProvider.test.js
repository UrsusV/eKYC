/**
 * BlockchainProvider Tests
 * Tests network connection, initialization, and provider operations
 */

// Mock ethers before importing
jest.mock('ethers', () => require('../mocks/ethers.mock'));
jest.mock('fs', () => require('../mocks/fs.mock'));

const BlockchainProvider = require('../../core/BlockchainProvider');
const { NetworkError, ConnectionError } = require('../../utils/errors');
const { MockJsonRpcProvider } = require('../mocks/ethers.mock');

describe('BlockchainProvider', () => {
  let provider;

  afterEach(async () => {
    if (provider) {
      await provider.disconnect();
    }
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should create provider with localhost network', () => {
      provider = new BlockchainProvider('localhost');

      expect(provider.network).toBe('localhost');
      expect(provider.isConnected).toBe(false);
      expect(provider.networkConfig).toBeDefined();
      expect(provider.networkConfig.chainId).toBe(31337);
    });

    test('should create provider with sepolia network', () => {
      provider = new BlockchainProvider('sepolia');

      expect(provider.network).toBe('sepolia');
      expect(provider.networkConfig.chainId).toBe(11155111);
    });

    test('should throw error for invalid network', () => {
      expect(() => {
        new BlockchainProvider('invalid');
      }).toThrow('Invalid network');
    });

    test('should default to localhost if no network specified', () => {
      provider = new BlockchainProvider();

      expect(provider.network).toBe('localhost');
    });
  });

  describe('Connection', () => {
    test('should connect to blockchain successfully', async () => {
      provider = new BlockchainProvider('localhost');

      await provider.connect();

      expect(provider.isConnected).toBe(true);
      expect(provider.provider).toBeInstanceOf(MockJsonRpcProvider);
      expect(provider.connectionRetries).toBe(0);
    });

    test('should verify chain ID on connection', async () => {
      provider = new BlockchainProvider('localhost');

      await provider.connect();

      const networkData = await provider.provider.getNetwork();
      expect(Number(networkData.chainId)).toBe(31337);
    });

    test('should retry connection on failure', async () => {
      provider = new BlockchainProvider('localhost');

      // Mock initial failures
      const mockGetNetwork = jest.fn()
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValue({ chainId: 31337n });

      provider.provider = {
        getNetwork: mockGetNetwork,
        getBlockNumber: jest.fn().mockResolvedValue(123),
        removeAllListeners: jest.fn(),
      };

      // Should retry and eventually succeed
      await expect(provider._verifyConnection()).rejects.toThrow();
    });

    test('should throw error after max retries', async () => {
      provider = new BlockchainProvider('localhost');
      provider.maxRetries = 2;

      // Mock persistent failure
      MockJsonRpcProvider.prototype.getNetwork = jest.fn()
        .mockRejectedValue(new Error('Persistent failure'));

      await expect(provider.connect()).rejects.toThrow(ConnectionError);
      expect(provider.isConnected).toBe(false);
    });

    test('should disconnect properly', async () => {
      provider = new BlockchainProvider('localhost');
      await provider.connect();

      expect(provider.isConnected).toBe(true);

      await provider.disconnect();

      expect(provider.isConnected).toBe(false);
      expect(provider.provider).toBeNull();
    });
  });

  describe('Provider Operations', () => {
    beforeEach(async () => {
      provider = new BlockchainProvider('localhost');
      await provider.connect();
    });

    test('should get provider instance', () => {
      const providerInstance = provider.getProvider();

      expect(providerInstance).toBeDefined();
      expect(providerInstance).toBeInstanceOf(MockJsonRpcProvider);
    });

    test('should throw error when getting provider before connection', () => {
      const disconnectedProvider = new BlockchainProvider('localhost');

      expect(() => disconnectedProvider.getProvider()).toThrow(ConnectionError);
    });

    test('should get current block number', async () => {
      const blockNumber = await provider.getBlockNumber();

      expect(blockNumber).toBe(123);
      expect(typeof blockNumber).toBe('number');
    });

    test('should cache block number', async () => {
      const spy = jest.spyOn(provider.provider, 'getBlockNumber');

      const blockNumber1 = await provider.getBlockNumber();
      const blockNumber2 = await provider.getBlockNumber();

      expect(blockNumber1).toBe(blockNumber2);
      expect(spy).toHaveBeenCalledTimes(1); // Called once, second from cache
    });

    test('should get gas price', async () => {
      const gasPrice = await provider.getGasPrice();

      expect(gasPrice).toBe(1000000000n);
      expect(typeof gasPrice).toBe('bigint');
    });

    test('should get fee data (EIP-1559)', async () => {
      const feeData = await provider.getFeeData();

      expect(feeData).toHaveProperty('gasPrice');
      expect(feeData).toHaveProperty('maxFeePerGas');
      expect(feeData).toHaveProperty('maxPriorityFeePerGas');
      expect(feeData.gasPrice).toBe(1000000000n);
    });

    test('should get balance for address', async () => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const balance = await provider.getBalance(address);

      expect(balance).toBe(10000000000000000000000n);
      expect(typeof balance).toBe('bigint');
    });

    test('should throw error for invalid address', async () => {
      await expect(provider.getBalance('invalid')).rejects.toThrow();
    });

    test('should get transaction count (nonce)', async () => {
      const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const count = await provider.getTransactionCount(address);

      expect(count).toBe(5);
      expect(typeof count).toBe('number');
    });

    test('should get transaction by hash', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const tx = await provider.getTransaction(txHash);

      expect(tx).toBeDefined();
      expect(tx.hash).toBe(txHash);
    });

    test('should get transaction receipt', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const receipt = await provider.getTransactionReceipt(txHash);

      expect(receipt).toBeDefined();
      expect(receipt.hash).toBe(txHash);
      expect(receipt.status).toBe(1);
    });

    test('should get block by number', async () => {
      const block = await provider.getBlock(123);

      expect(block).toBeDefined();
      expect(block.number).toBe(123);
    });

    test('should estimate gas for transaction', async () => {
      const tx = {
        to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        data: '0x',
      };

      const gasEstimate = await provider.estimateGas(tx);

      expect(gasEstimate).toBe(100000n);
      expect(typeof gasEstimate).toBe('bigint');
    });
  });

  describe('Transaction Waiting', () => {
    beforeEach(async () => {
      provider = new BlockchainProvider('localhost');
      await provider.connect();
    });

    test('should wait for transaction confirmation', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const receipt = await provider.waitForTransaction(txHash, 1);

      expect(receipt).toBeDefined();
      expect(receipt.hash).toBe(txHash);
      expect(receipt.status).toBe(1);
    });

    test('should wait for multiple confirmations', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      const receipt = await provider.waitForTransaction(txHash, 3);

      expect(receipt).toBeDefined();
    });

    test('should timeout if transaction takes too long', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

      // Mock timeout
      provider.provider.waitForTransaction = jest.fn()
        .mockImplementation(() => new Promise((resolve) => {
          setTimeout(() => resolve(null), 10000);
        }));

      await expect(
        provider.waitForTransaction(txHash, 1, 100)
      ).rejects.toThrow();
    });
  });

  describe('Health Check', () => {
    test('should return healthy status when connected', async () => {
      provider = new BlockchainProvider('localhost');
      await provider.connect();

      const health = await provider.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.connected).toBe(true);
      expect(health.network).toBe('localhost');
      expect(health.blockNumber).toBe(123);
    });

    test('should return unhealthy status when not connected', async () => {
      provider = new BlockchainProvider('localhost');

      const health = await provider.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.connected).toBe(false);
      expect(health.error).toBeDefined();
    });

    test('should return unhealthy on provider error', async () => {
      provider = new BlockchainProvider('localhost');
      await provider.connect();

      // Mock error
      provider.provider.getBlockNumber = jest.fn()
        .mockRejectedValue(new Error('Provider error'));

      const health = await provider.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.error).toBeDefined();
    });
  });

  describe('Network Information', () => {
    test('should get network info', () => {
      provider = new BlockchainProvider('localhost');

      const info = provider.getNetworkInfo();

      expect(info.name).toBe('localhost');
      expect(info.chainId).toBe(31337);
      expect(info.blockTime).toBe(2);
      expect(info.connected).toBe(false);
    });

    test('should update connected status in network info', async () => {
      provider = new BlockchainProvider('localhost');

      let info = provider.getNetworkInfo();
      expect(info.connected).toBe(false);

      await provider.connect();

      info = provider.getNetworkInfo();
      expect(info.connected).toBe(true);
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      provider = new BlockchainProvider('localhost');
      await provider.connect();
    });

    test('should cache values with TTL', async () => {
      provider._setCache('testKey', 'testValue', 60);

      const cached = provider._getCache('testKey', 60);
      expect(cached).toBe('testValue');
    });

    test('should return null for expired cache', async () => {
      provider._setCache('testKey', 'testValue', 0.001);

      await new Promise(resolve => setTimeout(resolve, 10));

      const cached = provider._getCache('testKey');
      expect(cached).toBeNull();
    });

    test('should clear cache', () => {
      provider._setCache('key1', 'value1');
      provider._setCache('key2', 'value2');

      provider._clearCache();

      expect(provider._getCache('key1')).toBeNull();
      expect(provider._getCache('key2')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should throw NetworkError on getBlockNumber failure', async () => {
      provider = new BlockchainProvider('localhost');
      await provider.connect();

      provider.provider.getBlockNumber = jest.fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(provider.getBlockNumber()).rejects.toThrow(NetworkError);
    });

    test('should throw NetworkError on getBalance failure', async () => {
      provider = new BlockchainProvider('localhost');
      await provider.connect();

      provider.provider.getBalance = jest.fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(
        provider.getBalance('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
      ).rejects.toThrow(NetworkError);
    });

    test('should handle chain ID mismatch', async () => {
      provider = new BlockchainProvider('localhost');

      // Mock wrong chain ID
      MockJsonRpcProvider.prototype.getNetwork = jest.fn()
        .mockResolvedValue({ chainId: 9999n });

      await expect(provider.connect()).rejects.toThrow(NetworkError);
    });
  });
});
