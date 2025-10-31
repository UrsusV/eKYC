require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-contract-sizer");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: false
    }
  },
  
  networks: {
    // Local Hardhat Network
    hardhat: {
      chainId: 31337,
      gas: "auto",
      gasPrice: "auto",
      blockGasLimit: 30000000,
      allowUnlimitedContractSize: false,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "10000000000000000000000" // 10000 ETH
      }
    },
    
    // Local Hardhat Node (for persistent local testing)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      timeout: 60000
    },
    
    // Ethereum Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
      timeout: 120000
    },
    
    // Ethereum Mainnet (Production)
    mainnet: {
      url: process.env.MAINNET_URL || "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID",
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto",
      timeout: 120000
    },
    
    // Polygon Mumbai Testnet (optional)
    mumbai: {
      url: process.env.MUMBAI_URL || "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto"
    },
    
    // BSC Testnet (optional)
    bscTestnet: {
      url: process.env.BSC_TESTNET_URL || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto"
    }
  },
  
  // Gas Reporter Configuration
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: process.env.CI ? "gas-report.txt" : undefined,
    noColors: process.env.CI ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    token: "ETH",
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    showTimeSpent: true,
    showMethodSig: true,
    excludeContracts: ["Migrations"]
  },
  
  // Contract Sizer Configuration
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: process.env.REPORT_SIZE === "true",
    strict: false,
    only: [],
    except: []
  },
  
  // Etherscan Verification Configuration
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || ""
    }
  },
  
  // Mocha Test Configuration
  mocha: {
    timeout: parseInt(process.env.TEST_TIMEOUT) || 40000,
    bail: false,
    allowUncaught: false,
    reporter: process.env.CI ? "json" : "spec",
    parallel: process.env.TEST_PARALLEL === "true"
  },
  
  // Paths Configuration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./scripts",
    deployments: "./deployments"
  },
  
  // TypeChain Configuration
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    externalArtifacts: [],
    dontOverrideCompile: false
  },
  
  // Coverage Configuration
  coverage: {
    exclude: ["test", "scripts"],
    skipFiles: ["Migrations.sol"]
  },
  
  // Compiler Settings
  outputSelection: {
    "*": {
      "*": [
        "abi",
        "evm.bytecode",
        "evm.deployedBytecode",
        "evm.methodIdentifiers",
        "metadata"
      ],
      "": ["ast"]
    }
  },
  
  // Additional Settings
  defaultNetwork: "hardhat",
  
  // Watcher Configuration (if hardhat-watcher is installed)
  watcher: {
    test: {
      tasks: ["test"],
      files: ["./test/**/*", "./contracts/**/*"],
      verbose: process.env.TEST_VERBOSE === "true"
    },
    compile: {
      tasks: ["compile"],
      files: ["./contracts/**/*"]
    }
  }
};

// Task to list available accounts
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  
  console.log("\n📋 Available Accounts:\n");
  for (const account of accounts) {
    const balance = await hre.ethers.provider.getBalance(account.address);
    console.log(`${account.address} - Balance: ${hre.ethers.formatEther(balance)} ETH`);
  }
  console.log();
});

// Task to get contract size
task("contract-size", "Prints contract sizes", async (taskArgs, hre) => {
  await hre.run("compile");
  const artifacts = await hre.artifacts.getAllFullyQualifiedNames();
  
  console.log("\n📏 Contract Sizes:\n");
  for (const artifact of artifacts) {
    if (!artifact.includes("Test") && !artifact.includes("Mock")) {
      const contractArtifact = await hre.artifacts.readArtifact(artifact);
      const bytecodeSize = contractArtifact.bytecode.length / 2 - 1;
      const deployedSize = contractArtifact.deployedBytecode.length / 2 - 1;
      
      console.log(`${artifact}:`);
      console.log(`  Bytecode:  ${bytecodeSize} bytes`);
      console.log(`  Deployed:  ${deployedSize} bytes`);
      console.log(`  Limit:     24576 bytes (24 KB)`);
      console.log(`  Remaining: ${24576 - deployedSize} bytes\n`);
    }
  }
});

// Task to verify network
task("network", "Prints network information", async (taskArgs, hre) => {
  const network = await hre.ethers.provider.getNetwork();
  const blockNumber = await hre.ethers.provider.getBlockNumber();
  const gasPrice = await hre.ethers.provider.getFeeData();
  
  console.log("\n🌐 Network Information:\n");
  console.log(`Name:         ${network.name}`);
  console.log(`Chain ID:     ${network.chainId}`);
  console.log(`Block Number: ${blockNumber}`);
  console.log(`Gas Price:    ${hre.ethers.formatUnits(gasPrice.gasPrice || 0n, "gwei")} Gwei`);
  console.log();
});
