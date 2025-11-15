/**
 * Ethers.js Mock
 * Provides mock implementations for ethers.js v6
 */

// Mock transaction receipt
const createMockReceipt = (overrides = {}) => ({
  hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  blockNumber: 123,
  blockHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  gasUsed: 100000n,
  gasPrice: 1000000000n,
  effectiveGasPrice: 1000000000n,
  status: 1,
  logs: [],
  contractAddress: null,
  index: 0,
  ...overrides,
});

// Mock transaction
const createMockTransaction = (overrides = {}) => ({
  hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  from: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  to: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  nonce: 0,
  gasLimit: 200000n,
  gasPrice: 1000000000n,
  data: '0x',
  value: 0n,
  chainId: 31337,
  wait: jest.fn().mockResolvedValue(createMockReceipt()),
  ...overrides,
});

// Mock wallet
class MockWallet {
  constructor(privateKey, provider) {
    this.privateKey = privateKey;
    this.provider = provider;
    this.address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  }

  connect(provider) {
    return new MockWallet(this.privateKey, provider);
  }

  async signMessage(message) {
    return '0xmocksignature';
  }

  async signTransaction(tx) {
    return '0xmocksignedtransaction';
  }

  async sendTransaction(tx) {
    return createMockTransaction();
  }

  async getAddress() {
    return this.address;
  }

  async encrypt(password, progressCallback) {
    return JSON.stringify({ version: 3, address: this.address });
  }

  get mnemonic() {
    return {
      phrase: 'test test test test test test test test test test test junk',
      path: "m/44'/60'/0'/0/0",
    };
  }

  derivePath(path) {
    return new MockWallet(this.privateKey, this.provider);
  }

  static createRandom(provider) {
    return new MockWallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider
    );
  }

  static fromPhrase(phrase, provider) {
    return new MockWallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider
    );
  }

  static async fromEncryptedJson(json, password) {
    return new MockWallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
  }
}

// Mock contract
class MockContract {
  constructor(address, abi, runner) {
    this.address = address;
    this.abi = abi;
    this.runner = runner;
    this.interface = {
      fragments: [
        { type: 'event', name: 'CredentialIssued' },
        { type: 'event', name: 'CredentialRevoked' },
        { type: 'event', name: 'ConsentGranted' },
      ],
      parseLog: jest.fn().mockReturnValue({
        name: 'CredentialIssued',
        args: {
          credentialId: '0xabcd1234',
          issuer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          holder: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          credentialType: 2,
        },
      }),
    };
    this.filters = {
      CredentialIssued: jest.fn().mockReturnValue({}),
      CredentialRevoked: jest.fn().mockReturnValue({}),
      ConsentGranted: jest.fn().mockReturnValue({}),
    };

    // Mock contract methods
    this.issueCredential = jest.fn().mockResolvedValue(createMockTransaction());
    this.verifyCredential = jest.fn().mockResolvedValue(true);
    this.getCredential = jest.fn().mockResolvedValue([
      '0xabcd1234',
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      1700000000n,
      false,
      2,
    ]);
    this.getHolderCredentials = jest.fn().mockResolvedValue(['0xabcd1234']);
    this.revokeCredential = jest.fn().mockResolvedValue(createMockTransaction());
    this.grantConsent = jest.fn().mockResolvedValue(createMockTransaction());
  }

  connect(runner) {
    return new MockContract(this.address, this.abi, runner);
  }

  async queryFilter(filter, fromBlock, toBlock) {
    return [
      {
        eventName: 'CredentialIssued',
        args: {
          credentialId: '0xabcd1234',
          issuer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          holder: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          credentialType: 2,
        },
        blockNumber: 123,
        blockHash: '0xabcdef',
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        transactionIndex: 0,
        logIndex: 0,
        removed: false,
      },
    ];
  }
}

// Mock provider
class MockJsonRpcProvider {
  constructor(url) {
    this.url = url;
  }

  async getNetwork() {
    return {
      chainId: 31337n,
      name: 'localhost',
    };
  }

  async getBlockNumber() {
    return 123;
  }

  async getBalance(address) {
    return 10000000000000000000000n; // 10000 ETH
  }

  async getTransactionCount(address, blockTag = 'latest') {
    return 5;
  }

  async getTransaction(hash) {
    return createMockTransaction({ hash });
  }

  async getTransactionReceipt(hash) {
    return createMockReceipt({ hash });
  }

  async getBlock(blockHashOrNumber) {
    return {
      number: 123,
      hash: '0xabcdef',
      timestamp: 1700000000,
      transactions: [],
    };
  }

  async waitForTransaction(hash, confirmations = 1, timeout = 300000) {
    return createMockReceipt({ hash });
  }

  async estimateGas(tx) {
    return 100000n;
  }

  async broadcastTransaction(signedTx) {
    return createMockTransaction();
  }

  async getFeeData() {
    return {
      gasPrice: 1000000000n,
      maxFeePerGas: 2000000000n,
      maxPriorityFeePerGas: 1000000000n,
    };
  }

  async getCode(address) {
    return '0x1234'; // Non-empty = deployed
  }

  removeAllListeners() {
    // Mock implementation
  }
}

// Utility functions
const mockUtils = {
  isAddress: jest.fn((address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }),

  getAddress: jest.fn((address) => {
    if (mockUtils.isAddress(address)) {
      return address;
    }
    throw new Error('Invalid address');
  }),

  parseUnits: jest.fn((value, unit) => {
    if (unit === 'gwei') {
      return BigInt(value) * 1000000000n;
    }
    if (unit === 'ether') {
      return BigInt(value) * 1000000000000000000n;
    }
    return BigInt(value);
  }),

  formatUnits: jest.fn((value, unit) => {
    const val = BigInt(value);
    if (unit === 'gwei') {
      return (Number(val) / 1000000000).toString();
    }
    if (unit === 'ether') {
      return (Number(val) / 1000000000000000000).toString();
    }
    return val.toString();
  }),

  parseEther: jest.fn((ether) => {
    return BigInt(ether) * 1000000000000000000n;
  }),

  formatEther: jest.fn((wei) => {
    return (Number(wei) / 1000000000000000000).toString();
  }),

  keccak256: jest.fn((data) => {
    return '0x' + '1234567890abcdef'.repeat(4);
  }),

  toUtf8Bytes: jest.fn((str) => {
    return Buffer.from(str, 'utf8');
  }),
};

// Export mock
const ethersExport = {
  JsonRpcProvider: MockJsonRpcProvider,
  Wallet: MockWallet,
  Contract: MockContract,
  isAddress: mockUtils.isAddress,
  getAddress: mockUtils.getAddress,
  parseUnits: mockUtils.parseUnits,
  formatUnits: mockUtils.formatUnits,
  parseEther: mockUtils.parseEther,
  formatEther: mockUtils.formatEther,
  keccak256: mockUtils.keccak256,
  toUtf8Bytes: mockUtils.toUtf8Bytes,
};

module.exports = {
  ethers: ethersExport,
  // Also export ethers as default for require('ethers') compatibility
  ...ethersExport,
  MockJsonRpcProvider,
  MockWallet,
  MockContract,
  createMockTransaction,
  createMockReceipt,
};
