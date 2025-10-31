# 🔧 Troubleshooting FAQ - CredentialRegistry Test Suite

## 📋 Table of Contents

1. [Integration Script Issues](#integration-script-issues)
2. [Test Execution Problems](#test-execution-problems)
3. [Compilation Errors](#compilation-errors)
4. [Dependency Issues](#dependency-issues)
5. [Configuration Problems](#configuration-problems)
6. [Git and GitHub Issues](#git-and-github-issues)
7. [General Questions](#general-questions)

---

## 🚀 Integration Script Issues

### Q1: Script says "blockchain directory not found"

**Problem**: 
```
❌ Error: 'blockchain' directory not found!
```

**Solution**:
```bash
# You need to run the script from eKYC root, not from blockchain/

# Wrong ❌
cd eKYC/blockchain
./integrate-tests.sh

# Correct ✅
cd eKYC
./integrate-tests.sh
```

---

### Q2: "Permission denied" when running script

**Problem**:
```
bash: ./integrate-tests.sh: Permission denied
```

**Solution**:
```bash
# Make the script executable
chmod +x integrate-tests.sh

# Then run it
./integrate-tests.sh
```

---

### Q3: Script can't find test files

**Problem**:
```
⚠️  CredentialRegistry.test.js not found
```

**Solution**:
```bash
# Ensure all downloaded files are in the same directory as the script
ls -la | grep "CredentialRegistry.test.js"

# Files should be in eKYC/ root alongside integrate-tests.sh
# If not, copy them there
cp /path/to/downloads/* /path/to/eKYC/
```

---

### Q4: Script hangs or freezes during npm install

**Problem**: Script stops at "Installing dependencies..."

**Solution**:
```bash
# 1. Press Ctrl+C to cancel
# 2. Clear npm cache
npm cache clean --force

# 3. Try manual installation
cd blockchain
rm -rf node_modules package-lock.json
npm install

# 4. Run script again
cd ..
./integrate-tests.sh
```

---

## 🧪 Test Execution Problems

### Q5: All tests fail with "Contract not found"

**Problem**:
```
Error: HH700: Artifact for contract "CredentialRegistry" not found
```

**Solution**:
```bash
# Compile contracts first
cd blockchain
npx hardhat compile

# Then run tests
npm test
```

---

### Q6: Some tests fail but others pass

**Problem**:
```
  65 passing
  3 failing
```

**Answer**: This is **normal** if your contract implementation differs from the test expectations.

**What to do**:
1. Review which tests failed
2. Check if your contract has different logic
3. Update tests to match your contract's behavior

```bash
# Example: Edit test file
nano test/CredentialRegistry.test.js

# Look for the failing test and adjust expectations
```

---

### Q7: "Timeout exceeded" error during tests

**Problem**:
```
Error: Timeout of 40000ms exceeded
```

**Solution**:
```bash
# Option 1: Increase timeout in hardhat.config.js
# Edit hardhat.config.js and change:
mocha: {
  timeout: 120000  // Increase to 2 minutes
}

# Option 2: Run tests with more time
npx hardhat test --timeout 120000
```

---

### Q8: "Nonce too high" or "replacement transaction underpriced"

**Problem**: Tests fail with nonce errors

**Solution**:
```bash
# Reset Hardhat network
npx hardhat clean

# Delete cache
rm -rf cache/ artifacts/

# Recompile
npx hardhat compile

# Run tests again
npm test
```

---

## 🔨 Compilation Errors

### Q9: "SPDX license identifier not provided"

**Problem**:
```
Warning: SPDX license identifier not provided in source file
```

**Solution**: This is just a warning, not an error. Add to top of contract:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
```

---

### Q10: "Source file requires different compiler version"

**Problem**:
```
Error: Source file requires different compiler version
```

**Solution**:
```javascript
// Edit hardhat.config.js
module.exports = {
  solidity: {
    version: "0.8.20",  // Match your contract version
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
```

---

### Q11: Contract size exceeds 24KB limit

**Problem**:
```
Error: Contract code size exceeds 24576 bytes
```

**Solution**:
```javascript
// 1. Enable optimizer in hardhat.config.js
solidity: {
  version: "0.8.20",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200  // Increase for smaller bytecode
    }
  }
}

// 2. Or split contract into multiple contracts
// 3. Or remove unused functions
```

---

## 📦 Dependency Issues

### Q12: "Cannot find module '@nomicfoundation/hardhat-toolbox'"

**Problem**:
```
Error: Cannot find module '@nomicfoundation/hardhat-toolbox'
```

**Solution**:
```bash
cd blockchain

# Install missing dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox \
  @nomicfoundation/hardhat-network-helpers \
  @nomicfoundation/hardhat-chai-matchers \
  chai ethers hardhat

# Run tests again
npm test
```

---

### Q13: "ethers is not defined" or "chai is not defined"

**Problem**: Test file can't find dependencies

**Solution**:
```bash
# Ensure dependencies are installed
npm list | grep -E "ethers|chai|hardhat"

# If not found, install them
npm install --save-dev ethers@^6.4.0 chai@^4.2.0

# If still issues, check package.json has them listed
```

---

### Q14: npm install fails with EACCES error

**Problem**:
```
Error: EACCES: permission denied
```

**Solution**:
```bash
# Option 1: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 2: Use sudo (not recommended)
sudo npm install

# Option 3: Change ownership
sudo chown -R $USER:$USER ~/.npm
```

---

## ⚙️ Configuration Problems

### Q15: .env file not being read

**Problem**: Environment variables not working

**Solution**:
```bash
# 1. Check .env file exists
ls -la blockchain/.env

# 2. Install dotenv
npm install dotenv

# 3. Ensure hardhat.config.js has:
require("dotenv").config();

# 4. Check .env format (no spaces around =)
PRIVATE_KEY=abc123...
SEPOLIA_URL=https://...
```

---

### Q16: Gas reporter not showing USD prices

**Problem**: Gas costs shown but not USD amounts

**Solution**:
```bash
# 1. Get CoinMarketCap API key from:
# https://coinmarketcap.com/api/

# 2. Add to .env
COINMARKETCAP_API_KEY=your_key_here

# 3. Enable in hardhat.config.js
gasReporter: {
  enabled: true,
  currency: "USD",
  coinmarketcap: process.env.COINMARKETCAP_API_KEY
}

# 4. Run with gas report
REPORT_GAS=true npm test
```

---

### Q17: Hardhat network not starting

**Problem**:
```
Error: listen EADDRINUSE: address already in use :::8545
```

**Solution**:
```bash
# Option 1: Kill process using port 8545
lsof -ti:8545 | xargs kill -9

# Option 2: Use different port
npx hardhat node --port 8546

# Option 3: Find and kill hardhat process
ps aux | grep hardhat
kill -9 <PID>
```

---

## 🐙 Git and GitHub Issues

### Q18: GitHub Actions workflow not running

**Problem**: Tests don't run automatically on push

**Solution**:
```bash
# 1. Check workflow file location
ls -la .github/workflows/test.yml

# 2. Check file is named correctly (must be .yml or .yaml)

# 3. Check GitHub Actions is enabled in repo settings

# 4. Check syntax is valid
cat .github/workflows/test.yml

# 5. Push a commit to trigger
git add .
git commit -m "Test CI/CD"
git push
```

---

### Q19: CI/CD fails with "Module not found"

**Problem**: GitHub Actions can't find dependencies

**Solution**:
```yaml
# In .github/workflows/test.yml, ensure these steps exist:

- name: Install dependencies
  run: |
    cd blockchain
    npm ci  # Use 'ci' not 'install' in CI

- name: Compile contracts
  run: |
    cd blockchain
    npx hardhat compile
```

---

### Q20: Want to exclude test files from git

**Problem**: Don't want to commit test results

**Solution**:
```bash
# Add to blockchain/.gitignore
coverage/
coverage.json
.coverage_artifacts/
.coverage_cache/
gas-report.txt
typechain/
typechain-types/
```

---

## ❓ General Questions

### Q21: Can I use these tests with a different contract?

**Answer**: Yes, but you'll need to modify them.

**Steps**:
1. Copy `CredentialRegistry.test.js` as a template
2. Update contract name references
3. Adjust function names and parameters
4. Modify test expectations
5. Add/remove tests as needed

---

### Q22: How do I add my own tests?

**Answer**: Add new test cases to the file.

**Example**:
```javascript
// In test/CredentialRegistry.test.js

describe("My Custom Tests", function () {
  it("Should do something specific", async function () {
    const { registry, owner } = await loadFixture(deployFixture);
    
    // Your test code here
    await registry.myFunction();
    
    // Your assertions
    expect(await registry.getSomething()).to.equal(expectedValue);
  });
});
```

---

### Q23: Can I run only specific tests?

**Answer**: Yes, use `--grep` flag.

**Examples**:
```bash
# Run only "issuance" tests
npx hardhat test --grep "issuance"

# Run only "revocation" tests
npx hardhat test --grep "revocation"

# Run tests matching multiple patterns
npx hardhat test --grep "issuance|revocation"

# Run specific test file
npx hardhat test test/CredentialRegistry.test.js
```

---

### Q24: How do I check test coverage?

**Answer**: Use the coverage command.

```bash
# Generate coverage report
npm run test:coverage

# View in browser
open coverage/index.html

# Or view summary in terminal
cat coverage/coverage-summary.json
```

---

### Q25: What if I don't want enhanced configuration?

**Answer**: Choose basic during integration.

```bash
# When prompted:
Upgrade to enhanced configuration? [y/N]
# Press N (or just ENTER)

# This keeps your existing package.json and hardhat.config.js
```

---

### Q26: Can I revert the integration?

**Answer**: Yes, use the backups.

```bash
# Your originals are in:
cd blockchain/backup_YYYYMMDD_HHMMSS/

# To restore:
cp backup_*/package.json ./
cp backup_*/hardhat.config.js ./
cp backup_*/.env.example ./

# Remove added files
rm -rf test/CredentialRegistry.test.js
rm -rf docs/
```

---

### Q27: How much disk space do I need?

**Answer**: Minimal space required.

```
Test Suite Files:     ~500KB
node_modules:         ~200MB (dependencies)
artifacts/ (compiled): ~5MB
Total:                ~205MB
```

---

### Q28: Will this work on Windows?

**Answer**: Yes, but some adjustments needed.

**Windows Users**:
```bash
# Use Git Bash or WSL for shell script
# Or follow manual integration instead

# In PowerShell:
# Run commands without ./ prefix
integrate-tests.sh  # Not ./integrate-tests.sh

# Or use WSL (recommended)
wsl
cd /mnt/c/path/to/eKYC
./integrate-tests.sh
```

---

### Q29: Can I run tests without Hardhat?

**Answer**: No, tests require Hardhat environment.

**Reason**: Tests use:
- Hardhat Network for blockchain simulation
- Hardhat plugins for testing features
- ethers.js with Hardhat integration

---

### Q30: Where can I get more help?

**Answer**: Check these resources:

```
1. Documentation in blockchain/docs/
   - README.md - Overview
   - QUICK_REFERENCE.md - Commands
   - TEST_DOCUMENTATION.md - Test details
   - INTEGRATION_GUIDE.md - Setup help

2. External Resources:
   - Hardhat Docs: https://hardhat.org/docs
   - Ethers.js Docs: https://docs.ethers.org/v6/
   - Chai Docs: https://chaijs.com
   - OpenZeppelin: https://docs.openzeppelin.com

3. Check test file comments:
   - blockchain/test/CredentialRegistry.test.js
   - Has inline documentation
```

---

## 🔍 Advanced Troubleshooting

### Debug Mode

```bash
# Run tests with stack traces
npx hardhat test --stack-trace

# Run with verbose hardhat output
npx hardhat test --verbose

# Show gas usage for each test
REPORT_GAS=true npx hardhat test
```

### Clean Reset

```bash
# Complete clean slate
cd blockchain
rm -rf node_modules/ cache/ artifacts/
npm install
npx hardhat compile
npm test
```

### Check Versions

```bash
# Check installed versions
node --version        # Should be v16+
npm --version         # Should be v8+
npx hardhat --version # Should be v2.19+

# Check package versions
npm list hardhat
npm list ethers
npm list chai
```

---

## 📞 Still Having Issues?

If your problem isn't listed here:

1. **Check error message carefully** - Often contains the solution
2. **Search the error** - Google the exact error message
3. **Review documentation** - Check blockchain/docs/
4. **Check file locations** - Ensure everything is in correct place
5. **Try clean install** - Delete and reinstall dependencies

---

## ✅ Common Fixes Summary

```bash
# Quick fixes for most common issues:

# 1. Permission issues
chmod +x integrate-tests.sh

# 2. Compilation issues
npx hardhat clean
npx hardhat compile

# 3. Dependency issues
rm -rf node_modules package-lock.json
npm install

# 4. Network issues
npx hardhat clean
rm -rf cache/

# 5. Test issues
npx hardhat test --stack-trace

# 6. Complete reset
cd blockchain
rm -rf node_modules cache artifacts
npm install
npx hardhat compile
npm test
```

---

**Last Updated**: 2025  
**Version**: 1.0  
**Status**: Production Ready ✅

If you encounter an issue not covered here, it may be a new edge case. Document it and check the error message carefully!
