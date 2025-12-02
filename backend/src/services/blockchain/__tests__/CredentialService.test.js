/**
 * CredentialService Integration Tests
 * Tests the main service integration and all credential operations
 */

jest.mock('ethers', () => require('./mocks/ethers.mock'));
jest.mock('fs', () => require('./mocks/fs.mock'));
jest.mock('fs/promises', () => require('./mocks/fs.mock'));

const CredentialService = require('../CredentialService');
const {  ContractError,
  ValidationError,
} = require('../utils/errors');

describe('CredentialService', () => {
  let credentialService;

  beforeEach(() => {
    credentialService = new CredentialService({
      network: 'localhost',
      contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      enableQueue: false,
      enableEventListener: false,
    });
  });

  afterEach(async () => {
    if (credentialService.isInitialized) {
      await credentialService.shutdown();
    }
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize service successfully', async () => {
      await credentialService.initialize();

      expect(credentialService.isInitialized).toBe(true);
      expect(credentialService.provider).toBeDefined();
      expect(credentialService.walletManager).toBeDefined();
      expect(credentialService.contractManager).toBeDefined();
      expect(credentialService.transactionManager).toBeDefined();
    });

    test('should not initialize twice', async () => {
      await credentialService.initialize();
      await credentialService.initialize();

      expect(credentialService.isInitialized).toBe(true);
    });

    test('should throw error if private key not configured', async () => {
      const service = new CredentialService({
        network: 'localhost',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        privateKey: null,
      });

      await expect(service.initialize()).rejects.toThrow('BLOCKCHAIN_PRIVATE_KEY not configured');
    });

    test('should throw error if contract address not configured', async () => {
      const service = new CredentialService({
        network: 'localhost',
        contractAddress: null,
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      });

      await expect(service.initialize()).rejects.toThrow('CONTRACT_ADDRESS not configured');
    });

    test('should shutdown gracefully', async () => {
      await credentialService.initialize();

      await credentialService.shutdown();

      expect(credentialService.isInitialized).toBe(false);
    });
  });

  describe('Issue Credential', () => {
    beforeEach(async () => {
      await credentialService.initialize();
    });

    test('should issue credential successfully', async () => {
      const result = await credentialService.issueCredential(
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        2,
        { useQueue: false }
      );

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
      expect(result.credentialId).toBeDefined();
      expect(result.blockNumber).toBeDefined();
    });

    test('should validate credential hash', async () => {
      await expect(
        credentialService.issueCredential(
          'invalid',
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          2
        )
      ).rejects.toThrow(ValidationError);
    });

    test('should validate holder address', async () => {
      await expect(
        credentialService.issueCredential(
          'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
          'invalid',
          2
        )
      ).rejects.toThrow(ValidationError);
    });

    test('should validate credential type', async () => {
      await expect(
        credentialService.issueCredential(
          'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          99
        )
      ).rejects.toThrow(ValidationError);
    });

    test('should queue credential issuance', async () => {
      const serviceWithQueue = new CredentialService({
        network: 'localhost',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        enableQueue: true,
        enableEventListener: false,
      });

      await serviceWithQueue.initialize();

      const result = await serviceWithQueue.issueCredential(
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        2,
        { useQueue: true }
      );

      expect(result.queued).toBe(true);
      expect(result.txId).toBeDefined();

      await serviceWithQueue.shutdown();
    });
  });

  describe('Verify Credential', () => {
    beforeEach(async () => {
      await credentialService.initialize();
    });

    test('should verify credential successfully', async () => {
      const result = await credentialService.verifyCredential(
        '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
      );

      expect(result.credentialId).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.verifiedAt).toBeDefined();
    });

    test('should validate credential ID', async () => {
      await expect(
        credentialService.verifyCredential(
          'invalid',
          'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
        )
      ).rejects.toThrow(ValidationError);
    });

    test('should validate document hash', async () => {
      await expect(
        credentialService.verifyCredential(
          '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
          'invalid'
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Get Credential', () => {
    beforeEach(async () => {
      await credentialService.initialize();
    });

    test('should get credential details', async () => {
      const credential = await credentialService.getCredential(
        '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab'
      );

      expect(credential.credentialId).toBeDefined();
      expect(credential.credentialHash).toBeDefined();
      expect(credential.issuer).toBeDefined();
      expect(credential.holder).toBeDefined();
      expect(credential.issuedAt).toBeDefined();
      expect(credential.isRevoked).toBeDefined();
      expect(credential.credentialType).toBeDefined();
    });

    test('should validate credential ID', async () => {
      await expect(
        credentialService.getCredential('invalid')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Get Holder Credentials', () => {
    beforeEach(async () => {
      await credentialService.initialize();
    });

    test('should get credentials for holder', async () => {
      const credentials = await credentialService.getHolderCredentials(
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
      );

      expect(Array.isArray(credentials)).toBe(true);
      expect(credentials.length).toBeGreaterThan(0);
    });

    test('should validate holder address', async () => {
      await expect(
        credentialService.getHolderCredentials('invalid')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Revoke Credential', () => {
    beforeEach(async () => {
      await credentialService.initialize();
    });

    test('should revoke credential successfully', async () => {
      const result = await credentialService.revokeCredential(
        '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        { useQueue: false }
      );

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
      expect(result.blockNumber).toBeDefined();
    });

    test('should validate credential ID for revocation', async () => {
      await expect(
        credentialService.revokeCredential('invalid')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Grant Consent', () => {
    beforeEach(async () => {
      await credentialService.initialize();
    });

    test('should grant consent successfully', async () => {
      const result = await credentialService.grantConsent(
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
        { useQueue: false }
      );

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBeDefined();
    });

    test('should validate verifier address', async () => {
      await expect(
        credentialService.grantConsent(
          'invalid',
          '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab'
        )
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Health Status', () => {
    test('should return not initialized status', async () => {
      const health = await credentialService.getHealthStatus();

      expect(health.initialized).toBe(false);
      expect(health.status).toBe('not_initialized');
    });

    test('should return healthy status when initialized', async () => {
      await credentialService.initialize();

      const health = await credentialService.getHealthStatus();

      expect(health.status).toBe('healthy');
      expect(health.provider).toBeDefined();
      expect(health.wallet).toBeDefined();
      expect(health.contract).toBeDefined();
    });

    test('should include queue status if enabled', async () => {
      const serviceWithQueue = new CredentialService({
        network: 'localhost',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        enableQueue: true,
      });

      await serviceWithQueue.initialize();

      const health = await serviceWithQueue.getHealthStatus();

      expect(health.queue).toBeDefined();

      await serviceWithQueue.shutdown();
    });
  });

  describe('Queue Operations', () => {
    test('should get queue status when enabled', async () => {
      const serviceWithQueue = new CredentialService({
        network: 'localhost',
        contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        enableQueue: true,
      });

      await serviceWithQueue.initialize();

      const status = serviceWithQueue.getQueueStatus();

      expect(status.enabled).toBe(true);
      expect(status.isProcessing).toBeDefined();
      expect(status.queueSize).toBeDefined();

      await serviceWithQueue.shutdown();
    });

    test('should return disabled for queue when not enabled', async () => {
      await credentialService.initialize();

      const status = credentialService.getQueueStatus();

      expect(status.enabled).toBe(false);
    });

    test('should throw error getting transaction status without queue', () => {
      expect(() => {
        credentialService.getTransactionStatus('test');
      }).toThrow('Transaction queue is not enabled');
    });
  });

  describe('Error Handling', () => {
    test('should throw error when not initialized', async () => {
      await expect(
        credentialService.issueCredential(
          'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          2
        )
      ).rejects.toThrow('not initialized');
    });

    test('should handle contract errors', async () => {
      await credentialService.initialize();

      credentialService.contractManager.getContract('credentialRegistry').issueCredential =
        jest.fn().mockRejectedValue(new Error('Contract error'));

      await expect(
        credentialService.issueCredential(
          'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          2,
          { useQueue: false }
        )
      ).rejects.toThrow();
    });
  });
});
