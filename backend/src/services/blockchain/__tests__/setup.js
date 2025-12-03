/**
 * Test Setup and Configuration
 * Configures Jest environment for blockchain service tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.BLOCKCHAIN_NETWORK = 'localhost';
process.env.BLOCKCHAIN_RPC_URL = 'http://localhost:8545';
process.env.CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
process.env.BLOCKCHAIN_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

process.env.MOCK_BLOCKCHAIN_PROVIDER = 'true';

const ethersTestMock = require('./mocks/ethers.mock');
const { MockJsonRpcProvider } = ethersTestMock;
global.__BLOCKCHAIN_PROVIDER_FACTORY__ = (networkConfig = {}) => {
  return new MockJsonRpcProvider(networkConfig.rpcUrl || 'http://127.0.0.1:8545');
};

const fsTestMock = require('./mocks/fs.mock');
global.__CONTRACT_ARTIFACT_LOADER__ = async () => fsTestMock.mockArtifact;

beforeEach(() => {
  if (typeof ethersTestMock.isAddress?.mockImplementation === 'function') {
    ethersTestMock.isAddress.mockImplementation(address => /^0x[a-fA-F0-9]{40}$/.test(address));
  }
  if (typeof ethersTestMock.getAddress?.mockImplementation === 'function') {
    ethersTestMock.getAddress.mockImplementation(address => address);
  }
});

// Override timeout constants to make tests fast
process.env.TEST_RPC_TIMEOUT = '1000';
process.env.TEST_TX_TIMEOUT = '2000';
process.env.TEST_CONFIRMATION_TIMEOUT = '3000';

// Suppress console logs during tests (keep error for debugging)
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep errors visible
  // Suppress success logs from logger
  success: jest.fn(),
};

// Global test timeout - reasonable for async operations with reduced timeouts
// jest.setTimeout(10000);
