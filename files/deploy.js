const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deployment script for CredentialRegistry contract
 * 
 * Usage:
 * - Local: npx hardhat run scripts/deploy.js
 * - Sepolia: npx hardhat run scripts/deploy.js --network sepolia
 * - Mainnet: npx hardhat run scripts/deploy.js --network mainnet
 */

async function main() {
  console.log("🚀 Starting CredentialRegistry deployment...\n");

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Deploy CredentialRegistry
  console.log("📦 Deploying CredentialRegistry contract...");
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  
  const registry = await CredentialRegistry.deploy();
  await registry.waitForDeployment();
  
  const contractAddress = await registry.getAddress();
  console.log(`✅ CredentialRegistry deployed to: ${contractAddress}`);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const owner = await registry.owner();
  console.log(`✅ Contract owner: ${owner}`);
  console.log(`✅ Owner matches deployer: ${owner === deployer.address}`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    owner: owner,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    transactionHash: registry.deploymentTransaction()?.hash
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const filename = path.join(deploymentsDir, `${network.name}-deployment.json`);
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filename}`);

  // Display summary
  console.log("\n" + "═".repeat(80));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("═".repeat(80));
  console.log(`Network:           ${deploymentInfo.network}`);
  console.log(`Chain ID:          ${deploymentInfo.chainId}`);
  console.log(`Contract Address:  ${deploymentInfo.contractAddress}`);
  console.log(`Deployer:          ${deploymentInfo.deployer}`);
  console.log(`Owner:             ${deploymentInfo.owner}`);
  console.log(`Block Number:      ${deploymentInfo.blockNumber}`);
  console.log(`Transaction Hash:  ${deploymentInfo.transactionHash}`);
  console.log(`Deployment Time:   ${deploymentInfo.deploymentTime}`);
  console.log("═".repeat(80));

  // Verification instructions for Etherscan (if not localhost)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n📝 To verify on Etherscan, run:");
    console.log(`npx hardhat verify --network ${network.name} ${contractAddress}`);
  }

  // Next steps
  console.log("\n✨ Next Steps:");
  console.log("1. Add authorized issuers using addAuthorizedIssuer()");
  console.log("2. Run the setup script: npx hardhat run scripts/setup-issuers.js");
  console.log("3. Test the deployment: npm run test:deployed");
  console.log("\n✅ Deployment completed successfully!\n");

  return {
    registry,
    deploymentInfo
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

module.exports = { main };
