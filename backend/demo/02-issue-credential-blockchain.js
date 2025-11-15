/**
 * Demo Script 2: Issue KYC Credential on Blockchain
 * This demonstrates the blockchain integration for storing KYC credentials
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { User, KycRequest, Document } = require('../src/models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Load contract deployment info
const deploymentFile = path.join(__dirname, '../../blockchain/deployments/localhost-deployment.json');
const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));

// Load contract ABI
const artifactFile = path.join(__dirname, '../../blockchain/artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json');
const artifact = JSON.parse(fs.readFileSync(artifactFile, 'utf8'));

async function issueCredentialOnBlockchain() {
  console.log('\n🔗 Starting Blockchain Credential Issuance...\n');

  // 1. Find the KYC Request to issue
  console.log('📋 Finding KYC Request...');
  const kycRequest = await KycRequest.findOne({ status: 'submitted' })
    .populate('userId')
    .populate('bankId');

  if (!kycRequest) {
    throw new Error('No submitted KYC request found. Run 01-populate-database.js first!');
  }

  console.log(`   ✅ Found KYC Request: ${kycRequest.requestId}`);
  console.log(`   👤 Customer: ${kycRequest.userId.personalInfo.fullName}`);
  console.log(`   🏦 Bank: ${kycRequest.bankId.bankName}`);

  // 2. Find the document
  const document = await Document.findOne({ kycRequestId: kycRequest._id });

  if (!document) {
    throw new Error('No document found for this KYC request');
  }

  console.log(`   📄 Document: ${document.documentId} (${document.documentType})`);
  console.log(`   🔐 Document Hash: ${document.hash.value.substring(0, 20)}...`);

  // 3. Setup blockchain connection
  console.log('\n🔗 Connecting to Blockchain...');

  // Connect to local Hardhat network (assumes it's running)
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

  // Use the bank's authorized issuer address (first signer for demo)
  const signer = await provider.getSigner(0);

  console.log(`   ✅ Connected to network`);
  console.log(`   📍 Contract Address: ${deploymentInfo.address}`);
  console.log(`   👤 Issuer Address: ${await signer.getAddress()}`);

  // 4. Load contract
  const credentialRegistry = new ethers.Contract(
    deploymentInfo.address,
    artifact.abi,
    signer
  );

  // 5. Prepare credential data
  console.log('\n📝 Preparing Credential Data...');

  // Create credential hash from document hash (must be bytes32 - 32 bytes)
  // Ensure it starts with 0x and has exactly 64 hex characters
  let credentialHash = document.hash.value;

  // If hash doesn't start with 0x, add it
  if (!credentialHash.startsWith('0x')) {
    credentialHash = '0x' + credentialHash;
  }

  // Ensure it's exactly 66 characters (0x + 64 hex chars = 32 bytes)
  if (credentialHash.length !== 66) {
    // Hash it properly to get exactly 32 bytes
    const crypto = require('crypto');
    credentialHash = '0x' + crypto.createHash('sha256').update(document.hash.value).digest('hex');
  }

  // Customer's wallet address (for demo, we'll use a generated address)
  // In production, this would be the customer's actual wallet
  const holderAddress = kycRequest.userId.blockchain?.walletAddress || '0x' + kycRequest.userId._id.toString().padEnd(40, '0');

  const credentialType = 2; // 2 = KYC credential (from contract definition)

  console.log(`   🔐 Credential Hash: ${credentialHash.substring(0, 20)}...`);
  console.log(`   👤 Holder Address: ${holderAddress}`);
  console.log(`   📋 Credential Type: ${credentialType} (KYC)`);

  // 6. Issue credential on blockchain
  console.log('\n⏳ Issuing credential on blockchain...');

  try {
    const tx = await credentialRegistry.issueCredential(
      credentialHash,
      holderAddress,
      credentialType
    );

    console.log(`   📝 Transaction Hash: ${tx.hash}`);
    console.log('   ⏳ Waiting for confirmation...');

    const receipt = await tx.wait();

    console.log(`   ✅ Transaction confirmed!`);
    console.log(`   ⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`   📦 Block Number: ${receipt.blockNumber}`);

    // Extract credential ID from event
    const event = receipt.logs.find(log => {
      try {
        const parsedLog = credentialRegistry.interface.parseLog(log);
        return parsedLog.name === 'CredentialIssued';
      } catch (e) {
        return false;
      }
    });

    let credentialId;
    if (event) {
      const parsedEvent = credentialRegistry.interface.parseLog(event);
      credentialId = parsedEvent.args.credentialId;
      console.log(`   🆔 Credential ID: ${credentialId}`);
    }

    // 7. Verify credential on blockchain
    console.log('\n🔍 Verifying Credential on Blockchain...');

    if (credentialId) {
      const isValid = await credentialRegistry.verifyCredential(credentialId, credentialHash);
      console.log(`   ${isValid ? '✅' : '❌'} Credential Valid: ${isValid}`);

      // Get credential details
      const credDetails = await credentialRegistry.getCredential(credentialId);
      console.log('\n📊 Credential Details from Blockchain:');
      console.log(`   Hash: ${credDetails[0].substring(0, 20)}...`);
      console.log(`   Issuer: ${credDetails[1]}`);
      console.log(`   Holder: ${credDetails[2]}`);
      console.log(`   Issued At: ${new Date(Number(credDetails[3]) * 1000).toLocaleString()}`);
      console.log(`   Is Revoked: ${credDetails[4]}`);
      console.log(`   Type: ${credDetails[5]}`);
    }

    // 8. Update KYC Request in database
    console.log('\n💾 Updating KYC Request in Database...');

    kycRequest.status = 'approved';
    kycRequest.workflow.approvedAt = new Date();
    kycRequest.blockchain = {
      credentialHash: credentialHash,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      issuedOnChain: true,
      issuedAt: new Date()
    };

    await kycRequest.save();
    console.log(`   ✅ KYC Request updated to 'approved'`);

    // Update user KYC status
    const user = await User.findById(kycRequest.userId._id);
    user.kycStatus = 'approved';
    user.kycLevel = kycRequest.kycLevel;
    user.blockchain = {
      walletAddress: holderAddress,
      credentialHash: credentialHash
    };
    await user.save();
    console.log(`   ✅ User KYC status updated`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 BLOCKCHAIN CREDENTIAL ISSUED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`\n📊 Transaction Summary:`);
    console.log(`   KYC Request: ${kycRequest.requestId}`);
    console.log(`   Customer: ${kycRequest.userId.personalInfo.fullName}`);
    console.log(`   Bank: ${kycRequest.bankId.bankName}`);
    console.log(`   Transaction Hash: ${tx.hash}`);
    console.log(`   Block Number: ${receipt.blockNumber}`);
    if (credentialId) {
      console.log(`   Credential ID: ${credentialId}`);
    }
    console.log(`   Status: ✅ Verified on Blockchain`);

    console.log(`\n🌐 View on MongoDB Express:`);
    console.log('   http://localhost:8081 (admin/admin123)');

    return {
      kycRequest,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      credentialId
    };

  } catch (error) {
    console.error('\n❌ Error issuing credential:', error.message);

    // Check if Hardhat node is running
    if (error.message.includes('ECONNREFUSED') || error.message.includes('network')) {
      console.log('\n⚠️  Make sure Hardhat local node is running:');
      console.log('   cd blockchain');
      console.log('   npx hardhat node');
    }

    throw error;
  }
}

// Run the blockchain issuance
issueCredentialOnBlockchain()
  .then(async (result) => {
    console.log('\n✅ Demo blockchain integration complete!\n');
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err);
    mongoose.disconnect();
    process.exit(1);
  });
