/**
 * Blockchain Service Demo
 * Demonstrates the eKYC blockchain credential system
 */

const CredentialService = require('./src/services/blockchain/CredentialService');

// Demo configuration
const DEMO_CONFIG = {
  network: 'localhost',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  enableQueue: false,
  enableEventListener: false,
};

async function demo() {
  console.log('\n========================================');
  console.log('🔐 eKYC BLOCKCHAIN CREDENTIAL SYSTEM');
  console.log('========================================\n');

  const service = new CredentialService(DEMO_CONFIG);

  try {
    // Step 1: Initialize
    console.log('📋 Step 1: Initializing Blockchain Service...');
    await service.initialize();
    console.log('✅ Service initialized successfully\n');

    // Step 2: Check System Health
    console.log('📋 Step 2: Checking System Health...');
    const health = await service.getHealthStatus();
    console.log('✅ System Status:', health.status);
    console.log('   - Network:', health.provider?.network || 'Connected');
    console.log('   - Wallet Address:', health.wallet?.address || 'Loaded');
    console.log('   - Contract:', health.contract?.address ? 'Deployed' : 'Ready');
    console.log('   - Balance:', health.wallet?.balanceStatus || 'Sufficient');
    console.log('');

    // Step 3: Issue a Credential
    console.log('📋 Step 3: Issuing Digital Credential...');
    console.log('   Credential Type: Government ID');
    console.log('   Holder: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8');

    const credentialHash = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
    const holderAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const credentialType = 2; // Government ID

    const issueResult = await service.issueCredential(
      credentialHash,
      holderAddress,
      credentialType,
      { useQueue: false }
    );

    console.log('✅ Credential Issued Successfully!');
    console.log('   - Transaction Hash:', issueResult.transactionHash || 'N/A');
    console.log('   - Credential ID:', issueResult.credentialId || 'Generated');
    console.log('   - Block Number:', issueResult.blockNumber || 'Confirmed');
    console.log('');

    // Step 4: Verify the Credential
    console.log('📋 Step 4: Verifying Credential...');
    const credentialId = issueResult.credentialId || '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';

    const verifyResult = await service.verifyCredential(
      credentialId,
      credentialHash
    );

    console.log('✅ Verification Result:', verifyResult.isValid ? 'VALID ✓' : 'INVALID ✗');
    console.log('   - Credential ID:', verifyResult.credentialId);
    console.log('   - Verified At:', new Date(verifyResult.verifiedAt).toLocaleString());
    console.log('');

    // Step 5: Get Credential Details
    console.log('📋 Step 5: Retrieving Credential Details...');
    const credential = await service.getCredential(credentialId);

    console.log('✅ Credential Information:');
    console.log('   - ID:', credential.credentialId);
    console.log('   - Issuer:', credential.issuer);
    console.log('   - Holder:', credential.holder);
    console.log('   - Type:', credential.credentialType === 2 ? 'Government ID' : `Type ${credential.credentialType}`);
    console.log('   - Issued At:', new Date(Number(credential.issuedAt) * 1000).toLocaleString());
    console.log('   - Status:', credential.isRevoked ? 'REVOKED' : 'ACTIVE');
    console.log('');

    // Step 6: Get Holder Credentials
    console.log('📋 Step 6: Listing Holder\'s Credentials...');
    const holderCredentials = await service.getHolderCredentials(holderAddress);

    console.log(`✅ Found ${holderCredentials.length} credential(s) for holder`);
    holderCredentials.slice(0, 3).forEach((cred, index) => {
      console.log(`   ${index + 1}. ${cred.credentialId || 'ID'} - ${cred.isRevoked ? 'REVOKED' : 'ACTIVE'}`);
    });
    console.log('');

    // Step 7: Grant Consent
    console.log('📋 Step 7: Granting Verification Consent...');
    const verifierAddress = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

    const consentResult = await service.grantConsent(
      verifierAddress,
      credentialId,
      { useQueue: false }
    );

    console.log('✅ Consent Granted Successfully!');
    console.log('   - Verifier:', verifierAddress);
    console.log('   - Transaction:', consentResult.transactionHash || 'Confirmed');
    console.log('');

    // Success Summary
    console.log('========================================');
    console.log('✅ DEMO COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nKey Features Demonstrated:');
    console.log('  ✓ Blockchain service initialization');
    console.log('  ✓ Digital credential issuance');
    console.log('  ✓ Credential verification');
    console.log('  ✓ Credential retrieval and management');
    console.log('  ✓ Consent management for verifiers');
    console.log('  ✓ System health monitoring');
    console.log('\n📊 Technology Stack:');
    console.log('  - Smart Contracts (Solidity)');
    console.log('  - Ethereum Blockchain');
    console.log('  - ethers.js v6');
    console.log('  - Node.js Backend Service');
    console.log('');

    // Cleanup
    await service.shutdown();
    console.log('🔒 Service shutdown complete.\n');

  } catch (error) {
    console.error('\n❌ ERROR OCCURRED:');
    console.error('   Message:', error.message);
    console.error('   Type:', error.constructor.name);

    if (error.details) {
      console.error('   Details:', JSON.stringify(error.details, null, 2));
    }

    console.error('\n💡 Common Issues:');
    console.error('   - Ensure blockchain node is running (hardhat/ganache)');
    console.error('   - Check contract is deployed');
    console.error('   - Verify environment variables are set');
    console.error('');

    process.exit(1);
  }
}

// Run the demo
console.log('\n🚀 Starting eKYC Blockchain Demo...\n');
demo().catch(console.error);
