/**
 * Event Listener Example
 * Demonstrates blockchain event monitoring
 */

require('dotenv').config({ path: '../../../.env' });
const { CredentialService } = require('../index');

async function main() {
  const credentialService = new CredentialService({
    enableEventListener: true,
  });

  try {
    console.log('=== Initializing Credential Service with Event Listener ===\n');
    await credentialService.initialize();

    // Watch for specific events
    console.log('=== Setting up event watchers ===\n');

    const unwatchIssued = credentialService.watchCredentialEvents(
      'CredentialIssued',
      (eventData) => {
        console.log('\n🎉 CredentialIssued Event:');
        console.log(`   Credential ID: ${eventData.args.credentialId}`);
        console.log(`   Issuer: ${eventData.args.issuer}`);
        console.log(`   Holder: ${eventData.args.holder}`);
        console.log(`   Type: ${eventData.args.credentialType}`);
        console.log(`   Block: ${eventData.blockNumber}`);
        console.log(`   TX Hash: ${eventData.transactionHash}`);
      }
    );

    const unwatchRevoked = credentialService.watchCredentialEvents(
      'CredentialRevoked',
      (eventData) => {
        console.log('\n⚠️  CredentialRevoked Event:');
        console.log(`   Credential ID: ${eventData.args.credentialId}`);
        console.log(`   Block: ${eventData.blockNumber}`);
        console.log(`   TX Hash: ${eventData.transactionHash}`);
      }
    );

    const unwatchConsent = credentialService.watchCredentialEvents(
      'ConsentGranted',
      (eventData) => {
        console.log('\n🔐 ConsentGranted Event:');
        console.log(`   Holder: ${eventData.args.holder}`);
        console.log(`   Verifier: ${eventData.args.verifier}`);
        console.log(`   Credential ID: ${eventData.args.credentialId}`);
        console.log(`   Block: ${eventData.blockNumber}`);
        console.log(`   TX Hash: ${eventData.transactionHash}`);
      }
    );

    console.log('Event watchers active. Monitoring blockchain...\n');

    // Issue a credential to trigger event
    console.log('=== Issuing test credential to trigger event ===\n');

    const documentHash = 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5';
    const holderAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    const result = await credentialService.issueCredential(
      documentHash,
      holderAddress,
      2,
      { useQueue: false }
    );

    console.log(`Credential issued: ${result.transactionHash}`);

    // Query historical events
    console.log('\n=== Querying Historical Events ===\n');

    const historicalEvents = await credentialService.queryCredentialEvents(
      'CredentialIssued',
      0,
      'latest'
    );

    console.log(`Found ${historicalEvents.length} historical CredentialIssued events:\n`);

    historicalEvents.forEach((event, index) => {
      console.log(`${index + 1}. Credential ID: ${event.args.credentialId}`);
      console.log(`   Holder: ${event.args.holder}`);
      console.log(`   Block: ${event.blockNumber}`);
      console.log(`   TX: ${event.transactionHash}\n`);
    });

    // Keep listening for 60 seconds
    console.log('=== Listening for events for 60 seconds... ===\n');
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Cleanup
    console.log('\n=== Stopping event listeners ===');
    unwatchIssued();
    unwatchRevoked();
    unwatchConsent();

    console.log('\n=== Success! ===');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await credentialService.shutdown();
  }
}

main();
