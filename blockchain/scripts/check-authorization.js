const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Checking Authorization Status...\n");

  // Get network
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name}`);

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}-deployment.json`);
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.address;

  console.log(`📄 Contract Address: ${contractAddress}\n`);

  // Get contract instance
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = CredentialRegistry.attach(contractAddress);

  // Address to check
  const addressToCheck = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  console.log(`Checking authorization for: ${addressToCheck}`);

  const isAuthorized = await credentialRegistry.authorizedIssuers(addressToCheck);

  console.log(`\nResult: ${isAuthorized ? "✅ AUTHORIZED" : "❌ NOT AUTHORIZED"}`);

  // Get admin for reference
  const admin = await credentialRegistry.admin();
  console.log(`\nContract Admin: ${admin}`);
  console.log(`Addresses match: ${admin.toLowerCase() === addressToCheck.toLowerCase() ? "✅ Yes" : "❌ No"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
