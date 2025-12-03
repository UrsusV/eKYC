/**
 * WalletManager Tests
 * Tests wallet operations, signing, and balance management
 */

jest.mock('ethers', () => require('../mocks/ethers.mock'));
jest.mock('fs', () => require('../mocks/fs.mock'));
jest.mock('fs/promises', () => require('../mocks/fs.mock'));

const WalletManager = require('../../managers/WalletManager');
const BlockchainProvider = require('../../core/BlockchainProvider');
const { WalletError, InsufficientFundsError } = require('../../utils/errors');
const { MockWallet } = require('../mocks/ethers.mock');

describe('WalletManager', () => {
  let provider;
  let walletManager;

  beforeEach(async () => {
    provider = new BlockchainProvider('localhost');
    await provider.connect();
    walletManager = new WalletManager(provider);
  });

  afterEach(async () => {
    await provider.disconnect();
    jest.clearAllMocks();
  });

  describe('Wallet Loading', () => {
    test('should load wallet from private key', () => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

      const wallet = walletManager.loadFromPrivateKey(privateKey);

      expect(wallet).toBeInstanceOf(MockWallet);
      expect(wallet.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      expect(walletManager.defaultWallet).toBe(wallet);
    });

    test('should load wallet from private key with custom ID', () => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

      const wallet = walletManager.loadFromPrivateKey(privateKey, 'custom');

      expect(walletManager.wallets.has('custom')).toBe(true);
    });

    test('should throw error for invalid private key', () => {
      expect(() => {
        walletManager.loadFromPrivateKey('invalid');
      }).toThrow(WalletError);
    });

    test('should load wallet from mnemonic', () => {
      const mnemonic = 'test test test test test test test test test test test junk';

      const wallet = walletManager.loadFromMnemonic(mnemonic);

      expect(wallet).toBeInstanceOf(MockWallet);
      expect(walletManager.defaultWallet).toBe(wallet);
    });

    test('should load wallet from mnemonic with custom path', () => {
      const mnemonic = 'test test test test test test test test test test test junk';

      const wallet = walletManager.loadFromMnemonic(mnemonic, 5, 'custom');

      expect(walletManager.wallets.has('custom')).toBe(true);
    });

    test('should throw error for missing mnemonic', () => {
      expect(() => {
        walletManager.loadFromMnemonic('');
      }).toThrow(WalletError);
    });

    test('should load wallet from encrypted JSON', async () => {
      const json = JSON.stringify({ version: 3, address: '0xf39Fd...' });
      const password = 'password123';

      const wallet = await walletManager.loadFromEncryptedJson(json, password);

      expect(wallet).toBeInstanceOf(MockWallet);
      expect(walletManager.defaultWallet).toBe(wallet);
    });

    test('should create random wallet', () => {
      const result = walletManager.createRandomWallet('random1');

      expect(result.wallet).toBeInstanceOf(MockWallet);
      expect(result.mnemonic).toBeDefined();
      expect(result.privateKey).toBeDefined();
      expect(result.address).toBeDefined();
      expect(walletManager.wallets.has('random1')).toBe(true);
    });
  });

  describe('Wallet Retrieval', () => {
    beforeEach(() => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(privateKey);
    });

    test('should get wallet by ID', () => {
      const wallet = walletManager.getWallet('default');

      expect(wallet).toBeInstanceOf(MockWallet);
    });

    test('should get default wallet', () => {
      const wallet = walletManager.getWallet();

      expect(wallet).toBe(walletManager.defaultWallet);
    });

    test('should throw error for non-existent wallet', () => {
      expect(() => {
        walletManager.getWallet('nonexistent');
      }).toThrow(WalletError);
    });

    test('should get wallet address', () => {
      const address = walletManager.getAddress();

      expect(address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    });
  });

  describe('Balance Operations', () => {
    beforeEach(() => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(privateKey);
    });

    test('should get wallet balance', async () => {
      const balance = await walletManager.getBalance();

      expect(balance).toBe(10000000000000000000000n);
      expect(typeof balance).toBe('bigint');
    });

    test('should check if wallet has sufficient balance', async () => {
      const requiredAmount = 1000000000000000000n; // 1 ETH

      const hasSufficient = await walletManager.hasSufficientBalance(requiredAmount);

      expect(hasSufficient).toBe(true);
    });

    test('should return false for insufficient balance', async () => {
      const requiredAmount = 100000000000000000000000n; // 100000 ETH (more than available)

      const hasSufficient = await walletManager.hasSufficientBalance(requiredAmount);

      expect(hasSufficient).toBe(false);
    });

    test('should validate sufficient balance', async () => {
      const requiredAmount = 1000000000000000000n;

      await expect(
        walletManager.validateSufficientBalance(requiredAmount)
      ).resolves.toBe(true);
    });

    test('should throw error for insufficient balance validation', async () => {
      const requiredAmount = 100000000000000000000000n;

      await expect(
        walletManager.validateSufficientBalance(requiredAmount)
      ).rejects.toThrow(InsufficientFundsError);
    });

    test('should check balance status - healthy', async () => {
      const status = await walletManager.checkBalanceStatus();

      expect(status.status).toBe('healthy');
      expect(status.balanceEth).toBeGreaterThan(1);
      expect(status.thresholds).toBeDefined();
    });

    test('should check balance status - critical', async () => {
      // Mock low balance
      provider.provider.getBalance = jest.fn()
        .mockResolvedValue(1000000000000000n); // 0.001 ETH

      const status = await walletManager.checkBalanceStatus();

      expect(status.status).toBe('critical');
      expect(status.message).toContain('critically low');
    });

    test('should check balance status - warning', async () => {
      // Mock warning balance
      provider.provider.getBalance = jest.fn()
        .mockResolvedValue(50000000000000000n); // 0.05 ETH

      const status = await walletManager.checkBalanceStatus();

      expect(status.status).toBe('warning');
      expect(status.message).toContain('low');
    });
  });

  describe('Signing Operations', () => {
    beforeEach(() => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(privateKey);
    });

    test('should sign message', async () => {
      const message = 'Hello, blockchain!';

      const signature = await walletManager.signMessage(message);

      expect(signature).toBe('0xmocksignature');
      expect(typeof signature).toBe('string');
    });

    test('should sign transaction', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 1000000000000000000n,
        gasLimit: 21000,
      };

      const signedTx = await walletManager.signTransaction(tx);

      expect(signedTx).toBe('0xmocksignedtransaction');
    });
  });

  describe('Transaction Sending', () => {
    beforeEach(() => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(privateKey);
    });

    test('should send transaction', async () => {
      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 1000000000000000000n,
      };

      const result = await walletManager.sendTransaction(tx);

      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
    });

    test('should throw error for insufficient funds when sending', async () => {
      // Mock insufficient balance
      provider.provider.getBalance = jest.fn()
        .mockResolvedValue(0n);

      const tx = {
        to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        value: 1000000000000000000n,
      };

      await expect(walletManager.sendTransaction(tx)).rejects.toThrow(InsufficientFundsError);
    });
  });

  describe('Wallet Encryption', () => {
    beforeEach(() => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(privateKey);
    });

    test('should encrypt wallet', async () => {
      const password = 'securePassword123';

      const encryptedJson = await walletManager.encryptWallet(password);

      expect(encryptedJson).toBeDefined();
      expect(typeof encryptedJson).toBe('string');
      const parsed = JSON.parse(encryptedJson);
      expect(parsed.version).toBe(3);
    });

    test('should encrypt wallet with progress callback', async () => {
      const password = 'securePassword123';
      const progressCallback = jest.fn();

      await walletManager.encryptWallet(password, 'default', progressCallback);

      // Progress callback might be called during encryption
    });
  });

  describe('Wallet Management', () => {
    test('should remove wallet', () => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(privateKey, 'wallet1');

      const removed = walletManager.removeWallet('wallet1');

      expect(removed).toBe(true);
      expect(walletManager.wallets.has('wallet1')).toBe(false);
    });

    test('should return false when removing non-existent wallet', () => {
      const removed = walletManager.removeWallet('nonexistent');

      expect(removed).toBe(false);
    });

    test('should get all wallets', () => {
      const pk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(pk, 'wallet1');
      walletManager.loadFromPrivateKey(pk, 'wallet2');

      const wallets = walletManager.getAllWallets();

      expect(wallets).toHaveLength(2);
      expect(wallets[0]).toHaveProperty('walletId');
      expect(wallets[0]).toHaveProperty('address');
      expect(wallets[0]).toHaveProperty('isDefault');
    });

    test('should set default wallet', () => {
      const pk = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(pk, 'wallet1');
      walletManager.loadFromPrivateKey(pk, 'wallet2');

      walletManager.setDefaultWallet('wallet2');

      expect(walletManager.defaultWallet).toBe(walletManager.wallets.get('wallet2'));
    });

    test('should throw error when setting non-existent wallet as default', () => {
      expect(() => {
        walletManager.setDefaultWallet('nonexistent');
      }).toThrow(WalletError);
    });
  });

  describe('Wallet Info', () => {
    beforeEach(() => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(privateKey);
    });

    test('should get wallet info', async () => {
      const info = await walletManager.getWalletInfo();

      expect(info).toHaveProperty('walletId');
      expect(info).toHaveProperty('address');
      expect(info).toHaveProperty('balance');
      expect(info).toHaveProperty('balanceEth');
      expect(info).toHaveProperty('balanceStatus');
      expect(info).toHaveProperty('transactionCount');
      expect(info).toHaveProperty('isDefault');
      expect(info.isDefault).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors during balance check', async () => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      walletManager.loadFromPrivateKey(privateKey);

      provider.provider.getBalance = jest.fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(walletManager.getBalance()).rejects.toThrow(WalletError);
    });

    test('should handle errors during transaction signing', async () => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const wallet = walletManager.loadFromPrivateKey(privateKey);

      wallet.signTransaction = jest.fn().mockRejectedValue(new Error('Signing error'));

      await expect(walletManager.signTransaction({})).rejects.toThrow(WalletError);
    });
  });
});
