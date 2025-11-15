/**
 * EventListener Tests
 * Tests blockchain event monitoring and processing
 */

jest.mock('ethers', () => require('../mocks/ethers.mock'));
jest.mock('fs', () => require('../mocks/fs.mock'));

const EventListener = require('../../managers/EventListener');
const BlockchainProvider = require('../../core/BlockchainProvider');
const ContractManager = require('../../managers/ContractManager');
const WalletManager = require('../../managers/WalletManager');
const { EventListenerError } = require('../../utils/errors');

describe('EventListener', () => {
  let provider;
  let walletManager;
  let contractManager;
  let eventListener;

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

    eventListener = new EventListener(provider, contractManager);
  });

  afterEach(async () => {
    if (eventListener.isListening) {
      eventListener.stopListening();
    }
    await provider.disconnect();
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    test('should create event listener', () => {
      expect(eventListener).toBeDefined();
      expect(eventListener.isListening).toBe(false);
      expect(eventListener.listeners.size).toBe(0);
    });
  });

  describe('Starting and Stopping', () => {
    test('should start listening to events', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      expect(eventListener.isListening).toBe(true);
      expect(eventListener.listeners.size).toBeGreaterThan(0);
    });

    test('should start listening to all events if none specified', async () => {
      await eventListener.startListening('testContract');

      expect(eventListener.isListening).toBe(true);
      expect(eventListener.listeners.size).toBe(3); // 3 events in mock
    });

    test('should set initial block number', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued'], {
        fromBlock: 100,
      });

      expect(eventListener.lastProcessedBlock.get('testContract')).toBe(100);
    });

    test('should use latest block by default', async () => {
      const spy = jest.spyOn(provider, 'getBlockNumber');

      await eventListener.startListening('testContract', ['CredentialIssued']);

      expect(spy).toHaveBeenCalled();
    });

    test('should stop listening to specific contract', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      eventListener.stopListening('testContract');

      expect(eventListener.listeners.size).toBe(0);
      expect(eventListener.lastProcessedBlock.has('testContract')).toBe(false);
    });

    test('should stop all listeners', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      eventListener.stopListening();

      expect(eventListener.isListening).toBe(false);
      expect(eventListener.listeners.size).toBe(0);
    });
  });

  describe('Event Registration', () => {
    test('should register event listener', async () => {
      const listenerId = await eventListener._registerEventListener(
        'testContract',
        'CredentialIssued',
        contractManager.getContract('testContract')
      );

      expect(listenerId).toBe('testContract:CredentialIssued');
      expect(eventListener.listeners.has(listenerId)).toBe(true);
    });

    test('should store listener data', async () => {
      const contract = contractManager.getContract('testContract');

      await eventListener._registerEventListener('testContract', 'CredentialIssued', contract);

      const listenerData = eventListener.listeners.get('testContract:CredentialIssued');
      expect(listenerData.contractId).toBe('testContract');
      expect(listenerData.eventName).toBe('CredentialIssued');
      expect(listenerData.contract).toBe(contract);
    });
  });

  describe('Event Querying', () => {
    test('should query historical events', async () => {
      await eventListener.startListening('testContract');

      const events = await eventListener.queryEvents(
        'testContract',
        'CredentialIssued',
        0,
        'latest'
      );

      expect(events).toHaveLength(1);
      expect(events[0].eventName).toBe('CredentialIssued');
      expect(events[0].args).toBeDefined();
    });

    test('should query events from specific block range', async () => {
      await eventListener.startListening('testContract');

      const events = await eventListener.queryEvents(
        'testContract',
        'CredentialIssued',
        100,
        200
      );

      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });

    test('should throw error on query failure', async () => {
      await eventListener.startListening('testContract');

      const contract = contractManager.getContract('testContract');
      contract.queryFilter = jest.fn().mockRejectedValue(new Error('Query failed'));

      await expect(
        eventListener.queryEvents('testContract', 'CredentialIssued')
      ).rejects.toThrow(EventListenerError);
    });
  });

  describe('Event Watching', () => {
    test('should watch specific event', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      const callback = jest.fn();
      const unwatch = eventListener.watchEvent('testContract', 'CredentialIssued', callback);

      expect(typeof unwatch).toBe('function');

      // Emit event
      eventListener.emit('testContract:CredentialIssued', { test: 'data' });

      expect(callback).toHaveBeenCalledWith({ test: 'data' });
    });

    test('should unwatch event', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      const callback = jest.fn();
      const unwatch = eventListener.watchEvent('testContract', 'CredentialIssued', callback);

      unwatch();

      eventListener.emit('testContract:CredentialIssued', { test: 'data' });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Event Processing', () => {
    test('should process event and emit', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      const eventSpy = jest.fn();
      eventListener.on('event', eventSpy);

      const mockEvent = {
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
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      };

      await eventListener._processEvent('testContract', 'CredentialIssued', mockEvent);

      expect(eventSpy).toHaveBeenCalled();
      const emittedData = eventSpy.mock.calls[0][0];
      expect(emittedData.eventName).toBe('CredentialIssued');
      expect(emittedData.contractId).toBe('testContract');
    });

    test('should emit multiple event types', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      const generalSpy = jest.fn();
      const specificSpy = jest.fn();
      const contractSpecificSpy = jest.fn();

      eventListener.on('event', generalSpy);
      eventListener.on('CredentialIssued', specificSpy);
      eventListener.on('testContract:CredentialIssued', contractSpecificSpy);

      const mockEvent = {
        eventName: 'CredentialIssued',
        args: {},
        blockNumber: 123,
        transactionHash: '0x1234',
        address: '0x5FbDB',
      };

      await eventListener._processEvent('testContract', 'CredentialIssued', mockEvent);

      expect(generalSpy).toHaveBeenCalled();
      expect(specificSpy).toHaveBeenCalled();
      expect(contractSpecificSpy).toHaveBeenCalled();
    });
  });

  describe('Polling', () => {
    test('should start polling interval', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued'], {
        pollingInterval: 1000,
      });

      expect(eventListener.pollingInterval).toBeDefined();
    });

    test('should stop polling on stop listening', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      eventListener.stopListening();

      expect(eventListener.pollingInterval).toBeNull();
    });
  });

  describe('Status', () => {
    test('should get listener status - not listening', () => {
      const status = eventListener.getStatus();

      expect(status.isListening).toBe(false);
      expect(status.listenerCount).toBe(0);
      expect(status.listeners).toEqual([]);
    });

    test('should get listener status - listening', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      const status = eventListener.getStatus();

      expect(status.isListening).toBe(true);
      expect(status.listenerCount).toBeGreaterThan(0);
      expect(status.listeners.length).toBeGreaterThan(0);
    });

    test('should get contract events count', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued', 'CredentialRevoked']);

      const count = eventListener.getContractEventsCount('testContract');

      expect(count).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors during event processing', async () => {
      await eventListener.startListening('testContract', ['CredentialIssued']);

      const mockEvent = {
        eventName: null, // Invalid
        args: {},
      };

      // Should not throw
      await eventListener._processEvent('testContract', 'CredentialIssued', mockEvent);
    });

    test('should handle contract errors gracefully', async () => {
      const contract = contractManager.getContract('testContract');
      contract.filters.CredentialIssued = jest.fn().mockImplementation(() => {
        throw new Error('Filter error');
      });

      await expect(
        eventListener.startListening('testContract', ['CredentialIssued'])
      ).rejects.toThrow();
    });
  });
});
