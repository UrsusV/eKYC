/**
 * Demo Script 3: Query and Display Demo Data
 * This shows the data in a nice format for the presentation
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Bank, KycRequest, Document } = require('../src/models');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function queryDemoData() {
  console.log('\n📊 eKYC System - Demo Data Report\n');
  console.log('='.repeat(70));

  // 1. Banks
  console.log('\n🏦 BANKS IN SYSTEM');
  console.log('='.repeat(70));

  const banks = await Bank.find({ isActive: true }).select('bankName bankCode routingNumber blockchainIntegration.walletAddress blockchainIntegration.isAuthorizedIssuer regulatory.complianceStatus');

  banks.forEach((bank, idx) => {
    console.log(`\n${idx + 1}. ${bank.bankName} (${bank.bankCode})`);
    console.log(`   Routing Number: ${bank.routingNumber}`);
    console.log(`   Wallet Address: ${bank.blockchainIntegration.walletAddress}`);
    console.log(`   Authorized Issuer: ${bank.blockchainIntegration.isAuthorizedIssuer ? '✅ Yes' : '❌ No'}`);
    console.log(`   Compliance: ${bank.regulatory.complianceStatus}`);
  });

  // 2. Bank Officers
  console.log('\n\n👥 BANK OFFICERS');
  console.log('='.repeat(70));

  const officers = await User.find({ role: 'bank_officer' })
    .populate('bankOfficerInfo.bankId', 'bankName')
    .select('personalInfo email bankOfficerInfo kycStatus');

  officers.forEach((officer, idx) => {
    console.log(`\n${idx + 1}. ${officer.personalInfo.fullName}`);
    console.log(`   Email: ${officer.email}`);
    console.log(`   Bank: ${officer.bankOfficerInfo.bankId.bankName}`);
    console.log(`   Employee ID: ${officer.bankOfficerInfo.employeeId}`);
    console.log(`   Department: ${officer.bankOfficerInfo.department}`);
    console.log(`   KYC Status: ${officer.kycStatus}`);
  });

  // 3. Customers
  console.log('\n\n👤 CUSTOMERS');
  console.log('='.repeat(70));

  const customers = await User.find({ role: 'customer' })
    .select('personalInfo email contactInfo.primaryPhone kycStatus kycLevel blockchain');

  customers.forEach((customer, idx) => {
    console.log(`\n${idx + 1}. ${customer.personalInfo.fullName}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Phone: ${customer.contactInfo.primaryPhone}`);
    console.log(`   NID: ${customer.personalInfo.nid}`);
    console.log(`   KYC Status: ${customer.kycStatus}`);
    console.log(`   KYC Level: ${customer.kycLevel}`);
    if (customer.blockchain?.walletAddress) {
      console.log(`   Wallet: ${customer.blockchain.walletAddress}`);
    }
  });

  // 4. KYC Requests
  console.log('\n\n📝 KYC REQUESTS');
  console.log('='.repeat(70));

  const kycRequests = await KycRequest.find()
    .populate('userId', 'personalInfo.firstName personalInfo.lastName email')
    .populate('bankId', 'bankName')
    .populate('workflow.assignedTo', 'personalInfo.firstName personalInfo.lastName')
    .sort({ createdAt: -1 });

  kycRequests.forEach((kyc, idx) => {
    console.log(`\n${idx + 1}. Request ID: ${kyc.requestId}`);
    console.log(`   Customer: ${kyc.userId.personalInfo.fullName}`);
    console.log(`   Bank: ${kyc.bankId.bankName}`);
    console.log(`   Type: ${kyc.requestType}`);
    console.log(`   Status: ${kyc.status}`);
    console.log(`   KYC Level: ${kyc.kycLevel}`);
    console.log(`   Priority: ${kyc.priority}`);
    console.log(`   Risk Level: ${kyc.riskAssessment.riskLevel}`);

    if (kyc.workflow.assignedTo) {
      console.log(`   Assigned To: ${kyc.workflow.assignedTo.personalInfo.fullName}`);
    }

    if (kyc.workflow.submittedAt) {
      console.log(`   Submitted: ${kyc.workflow.submittedAt.toLocaleDateString()}`);
    }

    if (kyc.workflow.approvedAt) {
      console.log(`   Approved: ${kyc.workflow.approvedAt.toLocaleDateString()}`);
    }

    // Blockchain info
    if (kyc.blockchain?.issuedOnChain) {
      console.log(`   📡 BLOCKCHAIN:`);
      console.log(`      ✅ Issued on Chain: Yes`);
      console.log(`      Transaction: ${kyc.blockchain.transactionHash}`);
      console.log(`      Block: ${kyc.blockchain.blockNumber}`);
      console.log(`      Credential Hash: ${kyc.blockchain.credentialHash.substring(0, 20)}...`);
    }

    // Verification checks
    const checks = kyc.verificationChecks;
    console.log(`   🔍 VERIFICATIONS:`);
    console.log(`      Phone: ${checks.phoneVerification?.status || 'pending'}`);
    console.log(`      Email: ${checks.emailVerification?.status || 'pending'}`);
    console.log(`      NID: ${checks.nidVerification?.status || 'pending'}`);
    console.log(`      Address: ${checks.addressVerification?.status || 'pending'}`);
  });

  // 5. Documents
  console.log('\n\n📄 DOCUMENTS');
  console.log('='.repeat(70));

  const documents = await Document.find()
    .populate('userId', 'personalInfo.firstName personalInfo.lastName')
    .populate('kycRequestId', 'requestId')
    .sort({ createdAt: -1 });

  documents.forEach((doc, idx) => {
    console.log(`\n${idx + 1}. Document ID: ${doc.documentId}`);
    console.log(`   Customer: ${doc.userId.personalInfo.fullName}`);
    console.log(`   KYC Request: ${doc.kycRequestId.requestId}`);
    console.log(`   Type: ${doc.documentType}`);
    console.log(`   Verification: ${doc.verification.status}`);
    console.log(`   File: ${doc.file.fileName}`);
    console.log(`   Size: ${(doc.file.fileSize / 1024).toFixed(2)} KB`);
    console.log(`   Hash: ${doc.hash.value.substring(0, 20)}...`);

    if (doc.blockchain?.isStoredOnChain) {
      console.log(`   📡 Blockchain: Yes (Hash: ${doc.blockchain.documentHash.substring(0, 20)}...)`);
    }
  });

  // 6. Statistics
  console.log('\n\n📊 SYSTEM STATISTICS');
  console.log('='.repeat(70));

  const stats = {
    totalBanks: await Bank.countDocuments({ isActive: true }),
    authorizedIssuers: await Bank.countDocuments({ 'blockchainIntegration.isAuthorizedIssuer': true }),
    totalOfficers: await User.countDocuments({ role: 'bank_officer' }),
    totalCustomers: await User.countDocuments({ role: 'customer' }),
    totalKycRequests: await KycRequest.countDocuments(),
    pendingRequests: await KycRequest.countDocuments({ status: { $in: ['pending', 'submitted', 'under_review'] } }),
    approvedRequests: await KycRequest.countDocuments({ status: 'approved' }),
    blockchainIssuedCredentials: await KycRequest.countDocuments({ 'blockchain.issuedOnChain': true }),
    totalDocuments: await Document.countDocuments(),
    verifiedDocuments: await Document.countDocuments({ 'verification.status': 'verified' })
  };

  console.log(`\n🏦 Banks: ${stats.totalBanks} (${stats.authorizedIssuers} authorized issuers)`);
  console.log(`👥 Bank Officers: ${stats.totalOfficers}`);
  console.log(`👤 Customers: ${stats.totalCustomers}`);
  console.log(`📝 KYC Requests: ${stats.totalKycRequests}`);
  console.log(`   - Pending: ${stats.pendingRequests}`);
  console.log(`   - Approved: ${stats.approvedRequests}`);
  console.log(`🔗 Blockchain Credentials: ${stats.blockchainIssuedCredentials}`);
  console.log(`📄 Documents: ${stats.totalDocuments} (${stats.verifiedDocuments} verified)`);

  console.log('\n' + '='.repeat(70));
  console.log('✅ Report Complete\n');
}

// Run the query
queryDemoData()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err);
    mongoose.disconnect();
    process.exit(1);
  });
