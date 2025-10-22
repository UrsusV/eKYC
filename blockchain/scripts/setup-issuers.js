const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔧 Setting up Authorized Issuers...\n");

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

  // Get admin account
  const [admin] = await hre.ethers.getSigners();
  console.log(`👤 Admin: ${admin.address}`);

  // Verify admin
  const contractAdmin = await credentialRegistry.admin();
  if (contractAdmin.toLowerCase() !== admin.address.toLowerCase()) {
    throw new Error(`Account mismatch! Contract admin: ${contractAdmin}, Your account: ${admin.address}`);
  }

  // Define authorized issuers (banks/institutions)
  // Replace these with actual bank wallet addresses
  const issuersToAdd = [
    {
      name: "Dutch Bangla Bank",
      address: process.env.ISSUER_DUTCH_BANGLA || "0x0000000000000000000000000000000000000001",
    },
    {
      name: "BRAC Bank",
      address: process.env.ISSUER_BRAC || "0x0000000000000000000000000000000000000002",
    },
    {
      name: "City Bank",
      address: process.env.ISSUER_CITY || "0x0000000000000000000000000000000000000003",
    },
  ];

  console.log(`\n📋 Adding ${issuersToAdd.length} authorized issuers...\n`);

  const addedIssuers = [];
  const failedIssuers = [];

  for (const issuer of issuersToAdd) {
    try {
      console.log(`⏳ Adding ${issuer.name} (${issuer.address})...`);

      // Check if already authorized
      const isAuthorized = await credentialRegistry.authorizedIssuers(issuer.address);

      if (isAuthorized) {
        console.log(`   ✓ Already authorized\n`);
        addedIssuers.push({ ...issuer, status: "already_authorized" });
        continue;
      }

      // Add issuer
      const tx = await credentialRegistry.addAuthorizedIssuer(issuer.address);
      console.log(`   📝 Transaction hash: ${tx.hash}`);

      await tx.wait();
      console.log(`   ✅ Successfully authorized\n`);

      addedIssuers.push({
        ...issuer,
        status: "newly_authorized",
        transactionHash: tx.hash
      });

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      failedIssuers.push({ ...issuer, error: error.message });
    }
  }

  // Verify all issuers
  console.log("🔍 Verifying authorized issuers...\n");

  for (const issuer of issuersToAdd) {
    const isAuthorized = await credentialRegistry.authorizedIssuers(issuer.address);
    console.log(`${isAuthorized ? "✅" : "❌"} ${issuer.name}: ${isAuthorized ? "Authorized" : "Not Authorized"}`);
  }

  // Save issuer info
  const issuersFile = path.join(__dirname, "..", "deployments", `${network.name}-issuers.json`);
  const issuerData = {
    network: network.name,
    contractAddress: contractAddress,
    timestamp: new Date().toISOString(),
    authorizedIssuers: addedIssuers,
    failedIssuers: failedIssuers,
  };

  fs.writeFileSync(issuersFile, JSON.stringify(issuerData, null, 2));
  console.log(`\n📄 Issuer data saved to: ${issuersFile}\n`);

  // Summary
  console.log("=" .repeat(60));
  console.log("📊 Setup Summary");
  console.log("=" .repeat(60));
  console.log(`Total Issuers: ${issuersToAdd.length}`);
  console.log(`Successfully Authorized: ${addedIssuers.length}`);
  console.log(`Failed: ${failedIssuers.length}`);
  console.log("=" .repeat(60));

  if (failedIssuers.length > 0) {
    console.log("\n⚠️  Some issuers failed to authorize. Check the logs above.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  });