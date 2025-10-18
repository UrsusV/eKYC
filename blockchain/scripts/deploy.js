const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Deploying CredentialRegistry contract...");

    // Get the contract factory
    const CredentialRegistry = await hre.ethers.getContractFactory("CredentialRegistry");

    // Deploy the contract
    const credentialRegistry = await CredentialRegistry.deploy();

    // Wait for deployment to finish
    await credentialRegistry.waitForDeployment();

    const address = await credentialRegistry.getAddress();
    const [deployer] = await hre.ethers.getSigners();

    console.log("CredentialRegistry deployed to:", address);
    console.log("Deployed by:", deployer.address);
    console.log("Network:", hre.network.name);
    console.log("\nIMPORTANT: Save this address in your .env file!");

    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        contract: "CredentialRegistry",
        address: address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        blockNumber: (await hre.ethers.provider.getBlockNumber()).toString()
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir);
    }

    fs.writeFileSync(
        path.join(deploymentsDir, `${hre.network.name}-deployment.json`),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\nDeployment info saved to:", `deployments/${hre.network.name}-deployment.json`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
