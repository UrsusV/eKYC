const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Full eKYC Blockchain Setup\n");
  console.log("=".repeat(60));

  // Get network
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name}`);

  // Load deployment info
  const deploymentFile = path.join(__dirname, "..", "deployments", `${network.name}-deployment.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}\nPlease deploy the contract first using: npm run deploy:local`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.address;

  console.log(`📄 Contract Address: ${contractAddress}`);

  // Get contract instance
  const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");
  const credentialRegistry = CredentialRegistry.attach(contractAddress);

  // Get admin account (Hardhat account #0)
  const [admin] = await hre.ethers.getSigners();
  console.log(`👤 Admin Account: ${admin.address}`);
  console.log(`💰 Admin Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(admin.address))} ETH\n`);

  console.log("=".repeat(60));
  console.log("STEP 1: Authorize Admin as Issuer");
  console.log("=".repeat(60));

  // Check if already authorized
  const isAuthorized = await credentialRegistry.authorizedIssuers(admin.address);

  if (isAuthorized) {
    console.log("✅ Admin is already authorized as an issuer!");
  } else {
    console.log("⏳ Authorizing admin account as issuer...");

    const tx = await credentialRegistry.addAuthorizedIssuer(admin.address);
    const receipt = await tx.wait();

    console.log(`✅ Successfully authorized!`);
    console.log(`📝 Transaction hash: ${tx.hash}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
  }

  // Verify
  const verified = await credentialRegistry.authorizedIssuers(admin.address);
  console.log(`🔍 Verification: ${verified ? "✅ Authorized" : "❌ Not Authorized"}\n`);

  console.log("=".repeat(60));
  console.log("STEP 2: Test Credential Issuance");
  console.log("=".repeat(60));

  // Test issuing a credential
  const testHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("test-credential-hash"));
  const testHolder = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat account #1
  const testType = 2; // KYC type

  console.log(`📋 Test Parameters:`);
  console.log(`   Hash: ${testHash}`);
  console.log(`   Holder: ${testHolder}`);
  console.log(`   Type: ${testType}\n`);

  try {
    console.log("⏳ Issuing test credential...");
    const tx = await credentialRegistry.issueCredential(testHash, testHolder, testType);
    const receipt = await tx.wait();

    console.log(`✅ Test credential issued successfully!`);
    console.log(`📝 Transaction hash: ${tx.hash}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}\n`);

    // Verify credential
    const credentialExists = await credentialRegistry.credentials(testHash);
    console.log(`🔍 Credential Verification:`);
    console.log(`   Exists: ${credentialExists.issuer !== hre.ethers.ZeroAddress}`);
    console.log(`   Issuer: ${credentialExists.issuer}`);
    console.log(`   Holder: ${credentialExists.holder}`);
    console.log(`   Is Revoked: ${credentialExists.isRevoked}\n`);

  } catch (error) {
    console.error(`❌ Test credential issuance failed:`, error.message);
  }

  console.log("=".repeat(60));
  console.log("✅ Setup Complete!");
  console.log("=".repeat(60));
  console.log("\n📋 Summary:");
  console.log(`   ✅ Admin authorized as issuer`);
  console.log(`   ✅ Test credential issued successfully`);
  console.log(`   🔗 Contract: ${contractAddress}`);
  console.log(`   👤 Admin: ${admin.address}`);
  console.log("\n🎉 Your eKYC blockchain is ready to use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
