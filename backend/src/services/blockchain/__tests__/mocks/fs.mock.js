/**
 * File System Mock
 * Mocks fs/promises for artifact loading
 */

const mockArtifact = {
  abi: [
    {
      type: 'function',
      name: 'issueCredential',
      inputs: [
        { name: '_credentialHash', type: 'bytes32' },
        { name: '_holder', type: 'address' },
        { name: '_credentialType', type: 'uint256' },
      ],
      outputs: [],
      stateMutability: 'nonpayable',
    },
    {
      type: 'function',
      name: 'verifyCredential',
      inputs: [
        { name: '_credentialId', type: 'bytes32' },
        { name: '_hash', type: 'bytes32' },
      ],
      outputs: [{ type: 'bool' }],
      stateMutability: 'view',
    },
    {
      type: 'function',
      name: 'getCredential',
      inputs: [{ name: '_credentialId', type: 'bytes32' }],
      outputs: [
        { name: 'credentialHash', type: 'bytes32' },
        { name: 'issuer', type: 'address' },
        { name: 'holder', type: 'address' },
        { name: 'issuedAt', type: 'uint256' },
        { name: 'isRevoked', type: 'bool' },
        { name: 'credentialType', type: 'uint256' },
      ],
      stateMutability: 'view',
    },
    {
      type: 'event',
      name: 'CredentialIssued',
      inputs: [
        { name: 'credentialId', type: 'bytes32', indexed: true },
        { name: 'issuer', type: 'address', indexed: true },
        { name: 'holder', type: 'address', indexed: true },
        { name: 'credentialType', type: 'uint256', indexed: false },
      ],
    },
  ],
  bytecode: '0x1234567890abcdef',
};

// Mock functions
const mockReadFile = jest.fn().mockResolvedValue(JSON.stringify(mockArtifact));

// Create promises object for fs.promises pattern
const mockFsPromises = {
  readFile: mockReadFile,
};

// Export structure
// When used with jest.mock('fs', ...), this becomes the entire fs module
module.exports = {
  // For require('fs').promises pattern
  promises: mockFsPromises,

  // For testing access
  mockArtifact,

  // Also spread mockFsPromises for direct fs/promises require
  ...mockFsPromises,
};
