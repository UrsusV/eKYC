const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔧 Authorizing Hardhat Default Account as Issuer...\n");

  // Get network
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name}`);

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}-deployment.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}\nPlease deploy the contract first.`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.address;

  console.log(`📄 Contract Address: ${contractAddress}\n`);

  // Get contract instance
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = CredentialRegistry.attach(contractAddress);

  // Get admin account (Hardhat account #0)
  const [admin] = await hre.ethers.getSigners();
  console.log(`👤 Admin Account: ${admin.address}`);

  // Check if already authorized
  const isAuthorized = await credentialRegistry.authorizedIssuers(admin.address);

  if (isAuthorized) {
    console.log("✅ Account is already authorized as an issuer!");
  } else {
    console.log("⏳ Authorizing account as issuer...");

    const tx = await credentialRegistry.addAuthorizedIssuer(admin.address);
    await tx.wait();

    console.log(`✅ Successfully authorized!`);
    console.log(`📝 Transaction hash: ${tx.hash}`);
  }

  // Verify
  const verified = await credentialRegistry.authorizedIssuers(admin.address);
  console.log(`\n🔍 Verification: ${verified ? "✅ Authorized" : "❌ Not Authorized"}`);

  console.log("\n============================================================");
  console.log("✅ Setup Complete!");
  console.log("============================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
