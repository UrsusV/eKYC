/**
 * Event Listener
 * Listens to and processes blockchain events
 */

const EventEmitter = require('events');
const { createLogger } = require('../utils/logger');
const { EventListenerError } = require('../utils/errors');
const { EVENTS } = require('../utils/constants');

class EventListener extends EventEmitter {
  constructor(provider, contractManager) {
    super();
    this.logger = createLogger('EventListener');
    this.provider = provider;
    this.contractManager = contractManager;
    this.listeners = new Map(); // listenerId -> listener data
    this.isListening = false;
    this.pollingInterval = null;
    this.lastProcessedBlock = new Map(); // contractId -> lastBlock
  }

  /**
   * Start listening to events
   */
  async startListening(contractId = 'default', eventNames = [], options = {}) {
    try {
      const {
        fromBlock = 'latest',
        pollingInterval = EVENTS.POLLING_INTERVAL,
        batchSize = EVENTS.BATCH_SIZE,
      } = options;

      const contract = this.contractManager.getContract(contractId);
      const contractAddress = this.contractManager.getContractAddress(contractId);

      // If no specific events, listen to all events
      const eventsToListen = eventNames.length > 0 ? eventNames : this._getAllEventNames(contract);

      this.logger.info('Starting event listener', {
        contractId,
        contractAddress,
        events: eventsToListen,
        fromBlock,
        pollingInterval,
      });

      // Set initial block
      const currentBlock = fromBlock === 'latest'
        ? await this.provider.getBlockNumber()
        : fromBlock;

      this.lastProcessedBlock.set(contractId, currentBlock);

      // Register listeners for each event
      for (const eventName of eventsToListen) {
        await this._registerEventListener(contractId, eventName, contract);
      }

      // Start polling if not already listening
      if (!this.isListening) {
        this._startPolling(pollingInterval);
      }

      this.isListening = true;

      this.logger.success('Event listener started', {
        contractId,
        events: eventsToListen.length,
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to start event listener', error, { contractId });
      throw new EventListenerError('Failed to start event listener', {
        contractId,
        originalError: error.message,
      });
    }
  }

  /**
   * Stop listening to events
   */
  stopListening(contractId = null) {
    try {
      if (contractId) {
        // Stop listening to specific contract
        this._removeContractListeners(contractId);
        this.lastProcessedBlock.delete(contractId);

        this.logger.info('Stopped listening to contract events', { contractId });
      } else {
        // Stop all listeners
        this._stopPolling();
        this._removeAllListeners();
        this.lastProcessedBlock.clear();
        this.isListening = false;

        this.logger.info('Stopped all event listeners');
      }

      return true;
    } catch (error) {
      this.logger.error('Failed to stop event listener', error, { contractId });
      throw new EventListenerError('Failed to stop event listener', {
        contractId,
        originalError: error.message,
      });
    }
  }

  /**
   * Register event listener
   */
  async _registerEventListener(contractId, eventName, contract) {
    try {
      const listenerId = `${contractId}:${eventName}`;

      // Create event filter
      const filter = contract.filters[eventName]();

      // Store listener data
      this.listeners.set(listenerId, {
        contractId,
        eventName,
        contract,
        filter,
        registeredAt: new Date().toISOString(),
      });

      this.logger.debug('Event listener registered', {
        listenerId,
        contractId,
        eventName,
      });

      return listenerId;
    } catch (error) {
      this.logger.error('Failed to register event listener', error, {
        contractId,
        eventName,
      });

      throw new EventListenerError('Failed to register event listener', {
        contractId,
        eventName,
        originalError: error.message,
      });
    }
  }

  /**
   * Start polling for events
   */
  _startPolling(interval) {
    if (this.pollingInterval) {
      return; // Already polling
    }

    this.logger.info('Starting event polling', { interval });

    this.pollingInterval = setInterval(async () => {
      await this._pollEvents();
    }, interval);
  }

  /**
   * Stop polling
   */
  _stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.logger.info('Stopped event polling');
    }
  }

  /**
   * Poll for new events
   */
  async _pollEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();

      for (const [listenerId, listenerData] of this.listeners.entries()) {
        const { contractId, eventName, contract, filter } = listenerData;

        const lastBlock = this.lastProcessedBlock.get(contractId) || 0;
        const fromBlock = lastBlock + 1;
        const toBlock = currentBlock;

        if (fromBlock > toBlock) {
          continue; // No new blocks
        }

        try {
          // Query events
          const events = await contract.queryFilter(filter, fromBlock, toBlock);

          if (events.length > 0) {
            this.logger.info(`Found ${events.length} events: ${eventName}`, {
              contractId,
              eventName,
              fromBlock,
              toBlock,
            });

            // Process events
            for (const event of events) {
              await this._processEvent(contractId, eventName, event);
            }
          }

          // Update last processed block
          this.lastProcessedBlock.set(contractId, toBlock);
        } catch (error) {
          this.logger.error('Error polling events', error, {
            listenerId,
            contractId,
            eventName,
            fromBlock,
            toBlock,
          });
        }
      }
    } catch (error) {
      this.logger.error('Error in polling cycle', error);
    }
  }

  /**
   * Process single event
   */
  async _processEvent(contractId, eventName, event) {
    try {
      const eventData = {
        contractId,
        eventName: event.eventName || eventName,
        args: this._formatEventArgs(event.args),
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        transactionHash: event.transactionHash,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        removed: event.removed,
        timestamp: new Date().toISOString(),
      };

      this.logger.event(eventData.eventName, event.address, {
        blockNumber: eventData.blockNumber,
        transactionHash: eventData.transactionHash,
        args: eventData.args,
      });

      // Emit event for application to handle
      this.emit('event', eventData);
      this.emit(eventName, eventData);
      this.emit(`${contractId}:${eventName}`, eventData);

      return eventData;
    } catch (error) {
      this.logger.error('Error processing event', error, {
        contractId,
        eventName,
        event,
      });
    }
  }

  /**
   * Query historical events
   */
  async queryEvents(contractId, eventName, fromBlock = 0, toBlock = 'latest') {
    try {
      const contract = this.contractManager.getContract(contractId);

      this.logger.info(`Querying historical events: ${eventName}`, {
        contractId,
        eventName,
        fromBlock,
        toBlock,
      });

      const filter = contract.filters[eventName]();
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      this.logger.success(`Found ${events.length} historical events`, {
        contractId,
        eventName,
        count: events.length,
      });

      return events.map(event => ({
        eventName: event.eventName || eventName,
        args: this._formatEventArgs(event.args),
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        transactionHash: event.transactionHash,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
      }));
    } catch (error) {
      this.logger.error('Failed to query historical events', error, {
        contractId,
        eventName,
      });

      throw new EventListenerError('Failed to query historical events', {
        contractId,
        eventName,
        fromBlock,
        toBlock,
        originalError: error.message,
      });
    }
  }

  /**
   * Watch specific event and call callback
   */
  watchEvent(contractId, eventName, callback) {
    try {
      const eventKey = `${contractId}:${eventName}`;

      this.on(eventKey, callback);

      this.logger.debug('Event watcher registered', {
        contractId,
        eventName,
      });

      return () => {
        this.off(eventKey, callback);
        this.logger.debug('Event watcher removed', { contractId, eventName });
      };
    } catch (error) {
      this.logger.error('Failed to watch event', error, { contractId, eventName });
      throw new EventListenerError('Failed to watch event', {
        contractId,
        eventName,
        originalError: error.message,
      });
    }
  }

  /**
   * Get all event names from contract ABI
   */
  _getAllEventNames(contract) {
    const eventNames = [];

    for (const fragment of contract.interface.fragments) {
      if (fragment.type === 'event') {
        eventNames.push(fragment.name);
      }
    }

    return eventNames;
  }

  /**
   * Format event args
   */
  _formatEventArgs(args) {
    const formatted = {};

    for (const [key, value] of Object.entries(args)) {
      if (isNaN(Number(key))) { // Skip numeric keys
        if (typeof value === 'bigint') {
          formatted[key] = value.toString();
        } else {
          formatted[key] = value;
        }
      }
    }

    return formatted;
  }

  /**
   * Remove contract listeners
   */
  _removeContractListeners(contractId) {
    const toRemove = [];

    for (const [listenerId, data] of this.listeners.entries()) {
      if (data.contractId === contractId) {
        toRemove.push(listenerId);
      }
    }

    for (const listenerId of toRemove) {
      this.listeners.delete(listenerId);
    }

    this.logger.debug(`Removed ${toRemove.length} listeners for contract`, { contractId });
  }

  /**
   * Remove all listeners
   */
  _removeAllListeners() {
    this.listeners.clear();
    this.removeAllListeners();
    this.logger.debug('Removed all event listeners');
  }

  /**
   * Get listener status
   */
  getStatus() {
    return {
      isListening: this.isListening,
      listenerCount: this.listeners.size,
      listeners: Array.from(this.listeners.entries()).map(([id, data]) => ({
        id,
        contractId: data.contractId,
        eventName: data.eventName,
        registeredAt: data.registeredAt,
      })),
      lastProcessedBlocks: Object.fromEntries(this.lastProcessedBlock),
    };
  }

  /**
   * Get contract events count
   */
  getContractEventsCount(contractId) {
    let count = 0;

    for (const data of this.listeners.values()) {
      if (data.contractId === contractId) {
        count++;
      }
    }

    return count;
  }
}

module.exports = EventListener;
