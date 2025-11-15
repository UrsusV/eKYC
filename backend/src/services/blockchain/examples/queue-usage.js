/**
 * Queue Usage Example
 * Demonstrates transaction queue management
 */

require('dotenv').config({ path: '../../../.env' });
const { CredentialService, QUEUE } = require('../index');

async function main() {
  const credentialService = new CredentialService({
    enableQueue: true,
    enableEventListener: true,
  });

  try {
    console.log('=== Initializing Credential Service with Queue ===\n');
    await credentialService.initialize();

    // Listen to queue events
    credentialService.transactionQueue.on('transaction:completed', ({ txId, result }) => {
      console.log(`\n✅ Transaction ${txId} completed!`);
      console.log(`   TX Hash: ${result.tx.hash}`);
      console.log(`   Block: ${result.receipt.blockNumber}`);
    });

    credentialService.transactionQueue.on('transaction:failed', ({ txId, error }) => {
      console.log(`\n❌ Transaction ${txId} failed!`);
      console.log(`   Error: ${error.message}`);
    });

    // Queue multiple credential issuances
    console.log('=== Queueing Multiple Credential Issuances ===\n');

    const credentials = [
      {
        hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        holder: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        type: 2,
        priority: QUEUE.PRIORITIES.HIGH,
      },
      {
        hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
        holder: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        type: 2,
        priority: QUEUE.PRIORITIES.NORMAL,
      },
      {
        hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
        holder: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        type: 2,
        priority: QUEUE.PRIORITIES.LOW,
      },
    ];

    const txIds = [];

    for (const cred of credentials) {
      const result = await credentialService.issueCredential(
        cred.hash,
        cred.holder,
        cred.type,
        {
          useQueue: true,
          priority: cred.priority,
          metadata: {
            description: `KYC credential for holder ${cred.holder}`,
          },
        }
      );

      console.log(`Queued: ${result.txId} (Priority: ${cred.priority})`);
      txIds.push(result.txId);
    }

    console.log('\n=== Queue Status ===');
    const queueStatus = credentialService.getQueueStatus();
    console.log(JSON.stringify(queueStatus, null, 2));

    // Wait for processing
    console.log('\n=== Waiting for queue processing... ===\n');

    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    // Check final status
    console.log('\n=== Final Queue Statistics ===');
    const finalStatus = credentialService.getQueueStatus();
    console.log(JSON.stringify(finalStatus.statistics, null, 2));

    console.log('\n=== Transaction Results ===');
    for (const txId of txIds) {
      const status = credentialService.getTransactionStatus(txId);
      console.log(`\n${txId}:`);
      console.log(`  Status: ${status?.status || 'unknown'}`);
      if (status?.data?.result) {
        console.log(`  TX Hash: ${status.data.result.tx.hash}`);
      }
    }

    console.log('\n=== Success! ===');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await credentialService.shutdown();
  }
}

main();
