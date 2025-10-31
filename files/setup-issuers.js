const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Setup script to add authorized issuers to deployed CredentialRegistry
 * 
 * Usage:
 * - Local: npx hardhat run scripts/setup-issuers.js
 * - Sepolia: npx hardhat run scripts/setup-issuers.js --network sepolia
 */

// Configure authorized issuers here
const AUTHORIZED_ISSUERS = [
  {
    name: "Bangladesh Bank",
    address: "0x0000000000000000000000000000000000000000", // Replace with actual address
    description: "Central bank of Bangladesh"
  },
  {
    name: "Commercial Bank 1",
    address: "0x0000000000000000000000000000000000000000", // Replace with actual address
    description: "Major commercial bank"
  },
  {
    name: "KYC Verification Service",
    address: "0x0000000000000000000000000000000000000000", // Replace with actual address
    description: "Third-party KYC verification provider"
  }
];

async function main() {
  console.log("🔧 Setting up Authorized Issuers...\n");

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Load deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const filename = path.join(deploymentsDir, `${network.name}-deployment.json`);

  if (!fs.existsSync(filename)) {
    console.error(`❌ Deployment file not found: ${filename}`);
    console.error("Please deploy the contract first using: npm run deploy");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(filename, "utf8"));
  console.log(`📄 Contract Address: ${deploymentInfo.contractAddress}\n`);

  // Get contract instance
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const registry = CredentialRegistry.attach(deploymentInfo.contractAddress);

  // Get signer (must be contract owner)
  const [signer] = await hre.ethers.getSigners();
  console.log(`👤 Signer: ${signer.address}`);

  // Verify signer is the owner
  const owner = await registry.owner();
  if (signer.address !== owner) {
    console.error(`❌ Error: Signer (${signer.address}) is not the contract owner (${owner})`);
    process.exit(1);
  }
  console.log(`✅ Signer verified as contract owner\n`);

  // Filter out zero addresses
  const validIssuers = AUTHORIZED_ISSUERS.filter(issuer => {
    if (issuer.address === "0x0000000000000000000000000000000000000000") {
      console.log(`⚠️  Skipping ${issuer.name} - address not configured`);
      return false;
    }
    return true;
  });

  if (validIssuers.length === 0) {
    console.log("⚠️  No valid issuers to add. Please configure addresses in AUTHORIZED_ISSUERS.");
    console.log("📝 Edit scripts/setup-issuers.js and add valid issuer addresses.\n");
    process.exit(0);
  }

  console.log(`📋 Adding ${validIssuers.length} authorized issuer(s)...\n`);

  // Add each issuer
  const results = [];
  for (let i = 0; i < validIssuers.length; i++) {
    const issuer = validIssuers[i];
    console.log(`[${i + 1}/${validIssuers.length}] Processing: ${issuer.name}`);
    console.log(`    Address: ${issuer.address}`);
    console.log(`    Description: ${issuer.description}`);

    try {
      // Check if already authorized
      const isAuthorized = await registry.authorizedIssuers(issuer.address);
      
      if (isAuthorized) {
        console.log(`    ℹ️  Already authorized - skipping`);
        results.push({
          ...issuer,
          status: "already_authorized",
          transactionHash: null
        });
      } else {
        // Add authorized issuer
        const tx = await registry.addAuthorizedIssuer(issuer.address);
        console.log(`    ⏳ Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`    ✅ Successfully authorized (Block: ${receipt.blockNumber})`);
        
        results.push({
          ...issuer,
          status: "success",
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        });
      }
    } catch (error) {
      console.log(`    ❌ Failed: ${error.message}`);
      results.push({
        ...issuer,
        status: "failed",
        error: error.message
      });
    }
    console.log();
  }

  // Save setup results
  const setupInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: deploymentInfo.contractAddress,
    setupTime: new Date().toISOString(),
    signer: signer.address,
    results: results
  };

  const setupFilename = path.join(deploymentsDir, `${network.name}-setup.json`);
  fs.writeFileSync(setupFilename, JSON.stringify(setupInfo, null, 2));
  console.log(`💾 Setup info saved to: ${setupFilename}\n`);

  // Display summary
  console.log("═".repeat(80));
  console.log("📊 SETUP SUMMARY");
  console.log("═".repeat(80));
  
  const successful = results.filter(r => r.status === "success").length;
  const alreadyAuthorized = results.filter(r => r.status === "already_authorized").length;
  const failed = results.filter(r => r.status === "failed").length;

  console.log(`Total Processed:       ${results.length}`);
  console.log(`✅ Successfully Added:  ${successful}`);
  console.log(`ℹ️  Already Authorized: ${alreadyAuthorized}`);
  console.log(`❌ Failed:              ${failed}`);
  console.log("═".repeat(80));

  // Verify all issuers
  console.log("\n🔍 Verifying authorized issuers...");
  for (const result of results) {
    if (result.status !== "failed") {
      const isAuthorized = await registry.authorizedIssuers(result.address);
      console.log(`${isAuthorized ? "✅" : "❌"} ${result.name}: ${result.address}`);
    }
  }

  console.log("\n✅ Setup completed!\n");

  // Next steps
  if (failed > 0) {
    console.log("⚠️  Some issuers failed to authorize. Please check the errors above.");
  } else {
    console.log("✨ All authorized issuers have been configured.");
    console.log("📝 You can now issue credentials using the authorized issuer accounts.\n");
  }

  return setupInfo;
}

// Execute setup
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:");
    console.error(error);
    process.exit(1);
  });

module.exports = { main, AUTHORIZED_ISSUERS };
