const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Integration test script for deployed CredentialRegistry contract
 * Tests basic functionality on the deployed contract
 * 
 * Usage:
 * - Local: npx hardhat run scripts/test-deployed.js
 * - Sepolia: npx hardhat run scripts/test-deployed.js --network sepolia
 */

async function main() {
  console.log("🧪 Testing Deployed CredentialRegistry Contract...\n");

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const filename = path.join(deploymentsDir, `${network.name}-deployment.json`);

  if (!fs.existsSync(filename)) {
    console.error(`❌ Deployment file not found: ${filename}`);
    console.error("Please deploy the contract first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(filename, "utf8"));
  console.log(`📄 Contract Address: ${deploymentInfo.contractAddress}\n`);

  // Get contract instance
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const registry = CredentialRegistry.attach(deploymentInfo.contractAddress);

  // Get accounts
  const [owner, issuer, user] = await hre.ethers.getSigners();
  
  console.log("👥 Test Accounts:");
  console.log(`   Owner:  ${owner.address}`);
  console.log(`   Issuer: ${issuer.address}`);
  console.log(`   User:   ${user.address}\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Verify owner
  console.log("Test 1: Verify contract owner");
  try {
    const contractOwner = await registry.owner();
    if (contractOwner === owner.address) {
      console.log(`✅ PASS - Owner is correct: ${contractOwner}\n`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL - Owner mismatch. Expected: ${owner.address}, Got: ${contractOwner}\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}\n`);
    testsFailed++;
  }

  // Test 2: Add authorized issuer
  console.log("Test 2: Add authorized issuer");
  try {
    const isAuthorizedBefore = await registry.authorizedIssuers(issuer.address);
    
    if (!isAuthorizedBefore) {
      const tx = await registry.connect(owner).addAuthorizedIssuer(issuer.address);
      await tx.wait();
      console.log(`   Transaction: ${tx.hash}`);
    }

    const isAuthorizedAfter = await registry.authorizedIssuers(issuer.address);
    if (isAuthorizedAfter) {
      console.log(`✅ PASS - Issuer authorized successfully\n`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL - Issuer not authorized\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}\n`);
    testsFailed++;
  }

  // Test 3: Issue credential
  console.log("Test 3: Issue credential");
  try {
    const nid = "1234567890123";
    const credentialHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`test-credential-${Date.now()}`));
    const expiryDate = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now

    const tx = await registry.connect(issuer).issueCredential(
      user.address,
      nid,
      credentialHash,
      expiryDate
    );
    await tx.wait();
    console.log(`   Transaction: ${tx.hash}`);

    const credential = await registry.getCredential(user.address, nid);
    if (credential.owner === user.address && credential.isValid) {
      console.log(`✅ PASS - Credential issued successfully`);
      console.log(`   NID: ${credential.nid}`);
      console.log(`   Owner: ${credential.owner}`);
      console.log(`   Issuer: ${credential.issuer}`);
      console.log(`   Valid: ${credential.isValid}\n`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL - Credential not issued correctly\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}\n`);
    testsFailed++;
  }

  // Test 4: Verify credential
  console.log("Test 4: Verify credential");
  try {
    const nid = "1234567890123";
    const isValid = await registry.verifyCredential(user.address, nid);
    
    if (isValid) {
      console.log(`✅ PASS - Credential verified successfully\n`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL - Credential verification failed\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}\n`);
    testsFailed++;
  }

  // Test 5: Grant consent
  console.log("Test 5: Grant consent");
  try {
    const nid = "1234567890123";
    const requester = issuer.address;

    const tx = await registry.connect(user).grantConsent(nid, requester);
    await tx.wait();
    console.log(`   Transaction: ${tx.hash}`);

    const hasConsent = await registry.hasConsent(user.address, nid, requester);
    if (hasConsent) {
      console.log(`✅ PASS - Consent granted successfully\n`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL - Consent not granted\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}\n`);
    testsFailed++;
  }

  // Test 6: Revoke consent
  console.log("Test 6: Revoke consent");
  try {
    const nid = "1234567890123";
    const requester = issuer.address;

    const tx = await registry.connect(user).revokeConsent(nid, requester);
    await tx.wait();
    console.log(`   Transaction: ${tx.hash}`);

    const hasConsent = await registry.hasConsent(user.address, nid, requester);
    if (!hasConsent) {
      console.log(`✅ PASS - Consent revoked successfully\n`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL - Consent not revoked\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}\n`);
    testsFailed++;
  }

  // Test 7: Revoke credential
  console.log("Test 7: Revoke credential");
  try {
    const nid = "1234567890123";

    const tx = await registry.connect(issuer).revokeCredential(user.address, nid);
    await tx.wait();
    console.log(`   Transaction: ${tx.hash}`);

    const isValid = await registry.verifyCredential(user.address, nid);
    if (!isValid) {
      console.log(`✅ PASS - Credential revoked successfully\n`);
      testsPassed++;
    } else {
      console.log(`❌ FAIL - Credential still valid after revocation\n`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ FAIL - Error: ${error.message}\n`);
    testsFailed++;
  }

  // Display summary
  console.log("═".repeat(80));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("═".repeat(80));
  console.log(`Total Tests:    ${testsPassed + testsFailed}`);
  console.log(`✅ Passed:       ${testsPassed}`);
  console.log(`❌ Failed:       ${testsFailed}`);
  console.log(`Success Rate:   ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);
  console.log("═".repeat(80));

  if (testsFailed === 0) {
    console.log("\n🎉 All tests passed! The deployed contract is working correctly.\n");
  } else {
    console.log("\n⚠️  Some tests failed. Please investigate the errors above.\n");
  }

  // Save test results
  const testResults = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: deploymentInfo.contractAddress,
    testTime: new Date().toISOString(),
    totalTests: testsPassed + testsFailed,
    passed: testsPassed,
    failed: testsFailed,
    successRate: ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)
  };

  const testFilename = path.join(deploymentsDir, `${network.name}-test-results.json`);
  fs.writeFileSync(testFilename, JSON.stringify(testResults, null, 2));
  console.log(`💾 Test results saved to: ${testFilename}\n`);

  return testResults;
}

// Execute tests
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Testing failed:");
    console.error(error);
    process.exit(1);
  });

module.exports = { main };
