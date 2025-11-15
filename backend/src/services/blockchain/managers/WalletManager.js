/**
 * Wallet Manager
 * Manages application wallets and signing operations
 */

const { ethers } = require('ethers');
const { createLogger } = require('../utils/logger');
const { WalletError, InsufficientFundsError } = require('../utils/errors');
const { WALLET } = require('../utils/constants');
const BlockchainValidator = require('../utils/validators');
const BlockchainHelpers = require('../utils/helpers');

class WalletManager {
  constructor(provider) {
    this.logger = createLogger('WalletManager');
    this.provider = provider;
    this.wallets = new Map(); // walletId -> Wallet instance
    this.defaultWallet = null;
  }

  /**
   * Load wallet from private key
   */
  loadFromPrivateKey(privateKey, walletId = 'default') {
    try {
      BlockchainValidator.validatePrivateKey(privateKey);

      const wallet = new ethers.Wallet(privateKey, this.provider.getProvider());

      this.wallets.set(walletId, wallet);

      if (walletId === 'default' || !this.defaultWallet) {
        this.defaultWallet = wallet;
      }

      this.logger.success('Wallet loaded from private key', {
        walletId,
        address: wallet.address,
      });

      return wallet;
    } catch (error) {
      this.logger.error('Failed to load wallet from private key', error, { walletId });
      throw new WalletError('Failed to load wallet from private key', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Load wallet from mnemonic
   */
  loadFromMnemonic(mnemonic, index = 0, walletId = 'default') {
    try {
      if (!mnemonic) {
        throw new WalletError('Mnemonic is required');
      }

      const path = `${WALLET.DERIVATION_PATH}/${index}`;
      const wallet = ethers.Wallet.fromPhrase(mnemonic, this.provider.getProvider()).derivePath(path);

      this.wallets.set(walletId, wallet);

      if (walletId === 'default' || !this.defaultWallet) {
        this.defaultWallet = wallet;
      }

      this.logger.success('Wallet loaded from mnemonic', {
        walletId,
        address: wallet.address,
        path,
      });

      return wallet;
    } catch (error) {
      this.logger.error('Failed to load wallet from mnemonic', error, { walletId });
      throw new WalletError('Failed to load wallet from mnemonic', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Load wallet from encrypted JSON
   */
  async loadFromEncryptedJson(json, password, walletId = 'default') {
    try {
      const wallet = await ethers.Wallet.fromEncryptedJson(json, password);
      const connectedWallet = wallet.connect(this.provider.getProvider());

      this.wallets.set(walletId, connectedWallet);

      if (walletId === 'default' || !this.defaultWallet) {
        this.defaultWallet = connectedWallet;
      }

      this.logger.success('Wallet loaded from encrypted JSON', {
        walletId,
        address: connectedWallet.address,
      });

      return connectedWallet;
    } catch (error) {
      this.logger.error('Failed to load wallet from encrypted JSON', error, { walletId });
      throw new WalletError('Failed to load wallet from encrypted JSON', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Create new random wallet
   */
  createRandomWallet(walletId = 'random') {
    try {
      const wallet = ethers.Wallet.createRandom(this.provider.getProvider());

      this.wallets.set(walletId, wallet);

      this.logger.success('Random wallet created', {
        walletId,
        address: wallet.address,
      });

      return {
        wallet,
        mnemonic: wallet.mnemonic.phrase,
        privateKey: wallet.privateKey,
        address: wallet.address,
      };
    } catch (error) {
      this.logger.error('Failed to create random wallet', error);
      throw new WalletError('Failed to create random wallet', {
        originalError: error.message,
      });
    }
  }

  /**
   * Get wallet by ID
   */
  getWallet(walletId = 'default') {
    const wallet = walletId === 'default' ? this.defaultWallet : this.wallets.get(walletId);

    if (!wallet) {
      throw new WalletError(`Wallet not found: ${walletId}`);
    }

    return wallet;
  }

  /**
   * Get wallet address
   */
  getAddress(walletId = 'default') {
    const wallet = this.getWallet(walletId);
    return wallet.address;
  }

  /**
   * Get wallet balance
   */
  async getBalance(walletId = 'default') {
    try {
      const wallet = this.getWallet(walletId);
      const balance = await this.provider.getBalance(wallet.address);

      this.logger.debug('Wallet balance retrieved', {
        walletId,
        address: wallet.address,
        balance: BlockchainHelpers.weiToEth(balance) + ' ETH',
      });

      return balance;
    } catch (error) {
      this.logger.error('Failed to get wallet balance', error, { walletId });
      throw new WalletError('Failed to get wallet balance', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Check if wallet has sufficient balance
   */
  async hasSufficientBalance(requiredAmount, walletId = 'default') {
    try {
      const balance = await this.getBalance(walletId);
      return balance >= requiredAmount;
    } catch (error) {
      this.logger.error('Failed to check wallet balance', error, { walletId });
      throw new WalletError('Failed to check wallet balance', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Validate wallet has sufficient balance
   */
  async validateSufficientBalance(requiredAmount, walletId = 'default') {
    const balance = await this.getBalance(walletId);

    if (balance < requiredAmount) {
      throw new InsufficientFundsError(
        `Insufficient funds. Required: ${BlockchainHelpers.weiToEth(requiredAmount)} ETH, ` +
        `Available: ${BlockchainHelpers.weiToEth(balance)} ETH`,
        {
          walletId,
          required: requiredAmount.toString(),
          available: balance.toString(),
        }
      );
    }

    return true;
  }

  /**
   * Check wallet balance status
   */
  async checkBalanceStatus(walletId = 'default') {
    try {
      const balance = await this.getBalance(walletId);
      const balanceEth = parseFloat(BlockchainHelpers.weiToEth(balance));

      let status = 'healthy';
      let message = 'Balance is sufficient';

      if (balanceEth < WALLET.MIN_BALANCE_CRITICAL) {
        status = 'critical';
        message = 'Balance is critically low! Immediate top-up required.';
        this.logger.error(`Critical: ${message}`, null, {
          walletId,
          balance: balanceEth + ' ETH',
        });
      } else if (balanceEth < WALLET.MIN_BALANCE_WARNING) {
        status = 'warning';
        message = 'Balance is low. Consider topping up.';
        this.logger.warn(message, {
          walletId,
          balance: balanceEth + ' ETH',
        });
      }

      return {
        status,
        message,
        balance: balance.toString(),
        balanceEth,
        thresholds: {
          warning: WALLET.MIN_BALANCE_WARNING,
          critical: WALLET.MIN_BALANCE_CRITICAL,
        },
      };
    } catch (error) {
      this.logger.error('Failed to check balance status', error, { walletId });
      throw new WalletError('Failed to check balance status', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Sign message
   */
  async signMessage(message, walletId = 'default') {
    try {
      const wallet = this.getWallet(walletId);
      const signature = await wallet.signMessage(message);

      this.logger.debug('Message signed', {
        walletId,
        address: wallet.address,
        messageLength: message.length,
      });

      return signature;
    } catch (error) {
      this.logger.error('Failed to sign message', error, { walletId });
      throw new WalletError('Failed to sign message', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Sign transaction
   */
  async signTransaction(transaction, walletId = 'default') {
    try {
      const wallet = this.getWallet(walletId);
      const signedTx = await wallet.signTransaction(transaction);

      this.logger.debug('Transaction signed', {
        walletId,
        address: wallet.address,
      });

      return signedTx;
    } catch (error) {
      this.logger.error('Failed to sign transaction', error, { walletId });
      throw new WalletError('Failed to sign transaction', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(transaction, walletId = 'default') {
    try {
      const wallet = this.getWallet(walletId);

      // Estimate gas cost
      const gasEstimate = await this.provider.estimateGas({
        ...transaction,
        from: wallet.address,
      });

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
      const estimatedCost = gasEstimate * gasPrice;

      // Add transaction value if present
      const totalCost = estimatedCost + (transaction.value || 0n);

      // Validate sufficient balance
      await this.validateSufficientBalance(totalCost, walletId);

      // Send transaction
      const tx = await wallet.sendTransaction(transaction);

      this.logger.transaction(tx.hash, 'sent', {
        from: wallet.address,
        to: transaction.to,
        estimatedGas: gasEstimate.toString(),
      });

      return tx;
    } catch (error) {
      this.logger.error('Failed to send transaction', error, { walletId });
      throw new WalletError('Failed to send transaction', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Encrypt wallet to JSON
   */
  async encryptWallet(password, walletId = 'default', progressCallback = null) {
    try {
      const wallet = this.getWallet(walletId);
      const encryptedJson = await wallet.encrypt(password, progressCallback);

      this.logger.success('Wallet encrypted', {
        walletId,
        address: wallet.address,
      });

      return encryptedJson;
    } catch (error) {
      this.logger.error('Failed to encrypt wallet', error, { walletId });
      throw new WalletError('Failed to encrypt wallet', {
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Remove wallet
   */
  removeWallet(walletId) {
    if (this.wallets.has(walletId)) {
      this.wallets.delete(walletId);

      if (this.defaultWallet && this.defaultWallet.address === this.wallets.get(walletId)?.address) {
        this.defaultWallet = null;
      }

      this.logger.info('Wallet removed', { walletId });
      return true;
    }

    return false;
  }

  /**
   * Get all wallet addresses
   */
  getAllWallets() {
    const wallets = [];

    for (const [walletId, wallet] of this.wallets.entries()) {
      wallets.push({
        walletId,
        address: wallet.address,
        isDefault: this.defaultWallet?.address === wallet.address,
      });
    }

    return wallets;
  }

  /**
   * Set default wallet
   */
  setDefaultWallet(walletId) {
    const wallet = this.wallets.get(walletId);

    if (!wallet) {
      throw new WalletError(`Wallet not found: ${walletId}`);
    }

    this.defaultWallet = wallet;
    this.logger.info('Default wallet changed', {
      walletId,
      address: wallet.address,
    });

    return wallet;
  }

  /**
   * Get wallet info
   */
  async getWalletInfo(walletId = 'default') {
    try {
      const wallet = this.getWallet(walletId);
      const balance = await this.getBalance(walletId);
      const balanceStatus = await this.checkBalanceStatus(walletId);
      const transactionCount = await this.provider.getTransactionCount(wallet.address);

      return {
        walletId,
        address: wallet.address,
        balance: balance.toString(),
        balanceEth: BlockchainHelpers.weiToEth(balance),
        balanceStatus: balanceStatus.status,
        transactionCount,
        isDefault: this.defaultWallet?.address === wallet.address,
      };
    } catch (error) {
      this.logger.error('Failed to get wallet info', error, { walletId });
      throw new WalletError('Failed to get wallet info', {
        walletId,
        originalError: error.message,
      });
    }
  }
}

module.exports = WalletManager;
