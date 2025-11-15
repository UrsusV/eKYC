/**
 * Basic Usage Example
 * Demonstrates basic operations with the Credential Service
 */

require('dotenv').config({ path: '../../../.env' });
const { CredentialService } = require('../index');

async function main() {
  const credentialService = new CredentialService();

  try {
    console.log('=== Initializing Credential Service ===\n');
    await credentialService.initialize();

    // Get health status
    console.log('=== Health Status ===');
    const health = await credentialService.getHealthStatus();
    console.log(JSON.stringify(health, null, 2));
    console.log('');

    // Example credential data
    const documentHash = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
    const holderAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Hardhat account #1
    const credentialType = 2; // KYC

    console.log('=== Issuing Credential ===');
    console.log(`Document Hash: ${documentHash}`);
    console.log(`Holder: ${holderAddress}`);
    console.log(`Type: ${credentialType}\n`);

    const issueResult = await credentialService.issueCredential(
      documentHash,
      holderAddress,
      credentialType,
      { useQueue: false } // Execute immediately
    );

    console.log('Issue Result:');
    console.log(JSON.stringify(issueResult, null, 2));
    console.log('');

    // Get credential details
    if (issueResult.credentialId) {
      console.log('=== Getting Credential Details ===');
      const credential = await credentialService.getCredential(issueResult.credentialId);
      console.log(JSON.stringify(credential, null, 2));
      console.log('');

      // Verify credential
      console.log('=== Verifying Credential ===');
      const verification = await credentialService.verifyCredential(
        issueResult.credentialId,
        documentHash
      );
      console.log(JSON.stringify(verification, null, 2));
      console.log('');

      // Get holder credentials
      console.log('=== Getting Holder Credentials ===');
      const holderCredentials = await credentialService.getHolderCredentials(holderAddress);
      console.log(`Total credentials: ${holderCredentials.length}`);
      console.log(holderCredentials);
      console.log('');
    }

    console.log('=== Success! ===');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await credentialService.shutdown();
  }
}

main();
