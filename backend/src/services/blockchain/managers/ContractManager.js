/**
 * Contract Manager
 * Manages smart contract interactions
 */

const { ethers } = require('ethers');
const fs = require('fs/promises');
const { createLogger } = require('../utils/logger');
const { ContractError, ValidationError } = require('../utils/errors');
const BlockchainValidator = require('../utils/validators');
const BlockchainHelpers = require('../utils/helpers');

class ContractManager {
  constructor(provider, walletManager) {
    this.logger = createLogger('ContractManager');
    this.provider = provider;
    this.walletManager = walletManager;
    this.contracts = new Map(); // contractId -> Contract instance
  }

  /**
   * Load contract from ABI and address
   */
  loadContract(abi, address, contractId = 'default', walletId = 'default') {
    try {
      BlockchainValidator.validateABI(abi);
      const validatedAddress = BlockchainValidator.validateAddress(address);

      const wallet = this.walletManager.getWallet(walletId);
      const contract = new ethers.Contract(validatedAddress, abi, wallet);

      this.contracts.set(contractId, {
        instance: contract,
        address: validatedAddress,
        abi,
        walletId,
      });

      this.logger.success('Contract loaded', {
        contractId,
        address: validatedAddress,
        walletAddress: wallet.address,
      });

      return contract;
    } catch (error) {
      this.logger.error('Failed to load contract', error, { contractId, address });
      throw new ContractError('Failed to load contract', {
        contractId,
        address,
        originalError: error.message,
      });
    }
  }

  /**
   * Load contract from artifact file
   */
  async loadContractFromArtifact(artifactPath, address, contractId = 'default', walletId = 'default') {
    try {
      const artifact = await this._readArtifact(artifactPath);
      return this.loadContract(artifact.abi, address, contractId, walletId);
    } catch (error) {
      this.logger.error('Failed to load contract from artifact', error, { artifactPath });
      throw new ContractError('Failed to load contract from artifact', {
        artifactPath,
        originalError: error.message,
      });
    }
  }

  /**
   * Read contract artifact
   */
  async _readArtifact(artifactPath) {
    try {
      if (typeof global.__CONTRACT_ARTIFACT_LOADER__ === 'function') {
        const injectedArtifact = await global.__CONTRACT_ARTIFACT_LOADER__(artifactPath);
        if (injectedArtifact) {
          if (!injectedArtifact.abi) {
            throw new Error('Artifact does not contain ABI');
          }
          return injectedArtifact;
        }
      }

      const data = await fs.readFile(artifactPath, 'utf8');
      const artifact = JSON.parse(data);

      if (!artifact.abi) {
        throw new Error('Artifact does not contain ABI');
      }

      return artifact;
    } catch (error) {
      throw new ContractError('Failed to read artifact file', {
        artifactPath,
        originalError: error.message,
      });
    }
  }

  /**
   * Get contract instance
   */
  getContract(contractId = 'default') {
    const contractData = this.contracts.get(contractId);

    if (!contractData) {
      throw new ContractError(`Contract not found: ${contractId}`);
    }

    return contractData.instance;
  }

  /**
   * Get contract data
   */
  getContractData(contractId = 'default') {
    const contractData = this.contracts.get(contractId);

    if (!contractData) {
      throw new ContractError(`Contract not found: ${contractId}`);
    }

    return {
      contractId,
      address: contractData.address,
      walletId: contractData.walletId,
      methods: this._getContractMethods(contractData.abi),
    };
  }

  /**
   * Get contract methods from ABI
   */
  _getContractMethods(abi) {
    return abi
      .filter(item => item.type === 'function')
      .map(item => ({
        name: item.name,
        inputs: item.inputs,
        outputs: item.outputs,
        stateMutability: item.stateMutability,
        isReadOnly: item.stateMutability === 'view' || item.stateMutability === 'pure',
      }));
  }

  /**
   * Call read-only contract method
   */
  async call(method, params = [], contractId = 'default') {
    try {
      const contract = this.getContract(contractId);

      if (typeof contract[method] !== 'function') {
        throw new ContractError(`Method not found: ${method}`);
      }

      this.logger.debug(`Calling contract method: ${method}`, {
        contractId,
        params,
      });

      const result = await contract[method](...params);

      this.logger.success(`Contract method ${method} called successfully`, {
        contractId,
        result: this._formatResult(result),
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to call contract method: ${method}`, error, {
        contractId,
        params,
      });

      throw new ContractError(`Failed to call contract method: ${method}`, {
        contractId,
        method,
        params,
        reason: BlockchainHelpers.parseContractError(error),
        originalError: error.message,
      });
    }
  }

  /**
   * Send transaction to contract method
   */
  async send(method, params = [], options = {}, contractId = 'default') {
    try {
      const contract = this.getContract(contractId);
      const contractData = this.contracts.get(contractId);

      if (typeof contract[method] !== 'function') {
        throw new ContractError(`Method not found: ${method}`);
      }

      this.logger.info(`Sending transaction to contract method: ${method}`, {
        contractId,
        params,
        options,
      });

      // Validate transaction options
      const txOptions = BlockchainValidator.sanitizeTxOptions(options);

      // Send transaction
      const tx = await contract[method](...params, txOptions);

      this.logger.transaction(tx.hash, `sent to ${method}`, {
        contractId,
        contractAddress: contractData.address,
        from: await contract.runner.getAddress(),
      });

      return tx;
    } catch (error) {
      this.logger.error(`Failed to send transaction to method: ${method}`, error, {
        contractId,
        params,
        options,
      });

      throw new ContractError(`Failed to send transaction to method: ${method}`, {
        contractId,
        method,
        params,
        reason: BlockchainHelpers.parseContractError(error),
        originalError: error.message,
      });
    }
  }

  /**
   * Estimate gas for contract method
   */
  async estimateGas(method, params = [], options = {}, contractId = 'default') {
    try {
      const contract = this.getContract(contractId);

      if (typeof contract[method] !== 'function') {
        throw new ContractError(`Method not found: ${method}`);
      }

      this.logger.debug(`Estimating gas for method: ${method}`, {
        contractId,
        params,
      });

      const gasEstimate = await contract[method].estimateGas(...params, options);

      this.logger.debug(`Gas estimated for ${method}`, {
        contractId,
        gasEstimate: gasEstimate.toString(),
      });

      return gasEstimate;
    } catch (error) {
      this.logger.error(`Failed to estimate gas for method: ${method}`, error, {
        contractId,
        params,
      });

      throw new ContractError(`Failed to estimate gas for method: ${method}`, {
        contractId,
        method,
        params,
        reason: BlockchainHelpers.parseContractError(error),
        originalError: error.message,
      });
    }
  }

  /**
   * Execute contract method with automatic gas estimation
   */
  async execute(method, params = [], options = {}, contractId = 'default') {
    try {
      // Estimate gas if not provided
      if (!options.gasLimit) {
        const gasEstimate = await this.estimateGas(method, params, options, contractId);
        options.gasLimit = Math.floor(Number(gasEstimate) * 1.2); // Add 20% buffer
      }

      // Send transaction
      const tx = await this.send(method, params, options, contractId);

      return tx;
    } catch (error) {
      this.logger.error(`Failed to execute contract method: ${method}`, error, {
        contractId,
        params,
      });

      throw new ContractError(`Failed to execute contract method: ${method}`, {
        contractId,
        method,
        params,
        originalError: error.message,
      });
    }
  }

  /**
   * Get contract events
   */
  async getEvents(eventName, fromBlock = 0, toBlock = 'latest', contractId = 'default') {
    try {
      const contract = this.getContract(contractId);
      const contractData = this.contracts.get(contractId);

      this.logger.debug(`Querying events: ${eventName}`, {
        contractId,
        fromBlock,
        toBlock,
      });

      const filter = contract.filters[eventName]();
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      this.logger.success(`Retrieved ${events.length} events: ${eventName}`, {
        contractId,
        count: events.length,
      });

      return events.map(event => ({
        eventName: event.eventName,
        args: this._formatEventArgs(event.args),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
      }));
    } catch (error) {
      this.logger.error(`Failed to get events: ${eventName}`, error, {
        contractId,
        fromBlock,
        toBlock,
      });

      throw new ContractError(`Failed to get events: ${eventName}`, {
        contractId,
        eventName,
        originalError: error.message,
      });
    }
  }

  /**
   * Check if contract is deployed
   */
  async isDeployed(contractId = 'default') {
    try {
      const contractData = this.contracts.get(contractId);

      if (!contractData) {
        return false;
      }

      const code = await this.provider.getProvider().getCode(contractData.address);
      return code !== '0x';
    } catch (error) {
      this.logger.error('Failed to check if contract is deployed', error, { contractId });
      return false;
    }
  }

  /**
   * Get contract address
   */
  getContractAddress(contractId = 'default') {
    const contractData = this.contracts.get(contractId);

    if (!contractData) {
      throw new ContractError(`Contract not found: ${contractId}`);
    }

    return contractData.address;
  }

  /**
   * Change contract signer (wallet)
   */
  changeContractSigner(walletId, contractId = 'default') {
    try {
      const contractData = this.contracts.get(contractId);

      if (!contractData) {
        throw new ContractError(`Contract not found: ${contractId}`);
      }

      const wallet = this.walletManager.getWallet(walletId);
      const newContract = contractData.instance.connect(wallet);

      this.contracts.set(contractId, {
        ...contractData,
        instance: newContract,
        walletId,
      });

      this.logger.info('Contract signer changed', {
        contractId,
        newWalletId: walletId,
        newAddress: wallet.address,
      });

      return newContract;
    } catch (error) {
      this.logger.error('Failed to change contract signer', error, { contractId, walletId });
      throw new ContractError('Failed to change contract signer', {
        contractId,
        walletId,
        originalError: error.message,
      });
    }
  }

  /**
   * Remove contract
   */
  removeContract(contractId) {
    if (this.contracts.has(contractId)) {
      this.contracts.delete(contractId);
      this.logger.info('Contract removed', { contractId });
      return true;
    }

    return false;
  }

  /**
   * Get all loaded contracts
   */
  getAllContracts() {
    const contracts = [];

    for (const [contractId, data] of this.contracts.entries()) {
      contracts.push({
        contractId,
        address: data.address,
        walletId: data.walletId,
      });
    }

    return contracts;
  }

  /**
   * Format result for logging
   */
  _formatResult(result) {
    if (typeof result === 'bigint') {
      return result.toString();
    }

    if (Array.isArray(result)) {
      return result.map(item => this._formatResult(item));
    }

    if (typeof result === 'object' && result !== null) {
      const formatted = {};
      for (const [key, value] of Object.entries(result)) {
        if (isNaN(Number(key))) { // Skip numeric keys
          formatted[key] = this._formatResult(value);
        }
      }
      return formatted;
    }

    return result;
  }

  /**
   * Format event args for logging
   */
  _formatEventArgs(args) {
    const formatted = {};

    for (const [key, value] of Object.entries(args)) {
      if (isNaN(Number(key))) { // Skip numeric keys
        formatted[key] = this._formatResult(value);
      }
    }

    return formatted;
  }
}

module.exports = ContractManager;
