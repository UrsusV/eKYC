# End-to-End Testing Guide

Complete guide for running end-to-end tests on the eKYC blockchain backend system.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Testing Scripts](#testing-scripts)
- [Test Categories](#test-categories)
- [Manual Testing](#manual-testing)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Docker**: Latest version
- **Docker Compose**: Latest version

### Installation Check
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Docker
docker --version
docker-compose --version

# Verify Docker is running
docker info
```

---

## Quick Start

### Option 1: Automated Full E2E Test Suite

Run all tests automatically with a single command:

```bash
cd backend
npm run test:e2e
```

This will:
1. ✅ Setup Docker services (MongoDB, Redis)
2. ✅ Run unit tests
3. ✅ Run integration tests
4. ✅ Start backend server
5. ✅ Run E2E demo flow
6. ✅ Test all API endpoints
7. ✅ Generate test report
8. ✅ Cleanup resources

### Option 2: With Blockchain

To include Hardhat blockchain in E2E tests:

```bash
npm run test:e2e:blockchain
```

### Option 3: Clean Database Before Testing

```bash
npm run test:e2e:clean
```

---

## Testing Scripts

### 1. Setup Test Environment

**Script:** `scripts/setup-test-env.sh`

Sets up the complete testing environment.

```bash
# Basic setup (MongoDB + Redis only)
./scripts/setup-test-env.sh

# With Hardhat blockchain
./scripts/setup-test-env.sh --with-blockchain

# Clean database before setup
./scripts/setup-test-env.sh --clean-db

# Both options
./scripts/setup-test-env.sh --with-blockchain --clean-db
```

**What it does:**
- ✓ Checks Docker is running
- ✓ Stops existing containers
- ✓ Starts MongoDB and Redis containers
- ✓ Waits for services to be ready
- ✓ (Optional) Starts Hardhat blockchain
- ✓ (Optional) Deploys smart contracts
- ✓ (Optional) Cleans test database
- ✓ Creates `.env.test` file

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║        eKYC Backend - Test Environment Setup             ║
╚════════════════════════════════════════════════════════════╝

✓ Docker is running
✓ Docker Compose is available
✓ Existing containers stopped
✓ MongoDB and Redis started
✓ MongoDB is ready
✓ Redis is ready
✓ Test environment setup complete!

Services Status:
  • MongoDB:    Running (localhost:27017)
  • Redis:      Running (localhost:6379)
```

### 2. Run E2E Tests

**Script:** `scripts/run-e2e-tests.sh`

Runs complete end-to-end test suite.

```bash
# Full E2E test suite
./scripts/run-e2e-tests.sh

# With blockchain
./scripts/run-e2e-tests.sh --with-blockchain

# Clean database before tests
./scripts/run-e2e-tests.sh --clean-db

# Skip setup (use existing services)
./scripts/run-e2e-tests.sh --skip-setup
```

**Test Stages:**

1. **Environment Setup** (unless --skip-setup)
   - Docker services
   - Blockchain (if requested)

2. **Unit Tests**
   - Model tests
   - Service tests
   - Utility tests
   - Middleware tests

3. **Integration Tests**
   - Auth API tests
   - KYC API tests
   - Bank API tests
   - Consent API tests

4. **Backend Server**
   - Starts server on port 5001
   - Waits for health check

5. **E2E Demo Flow**
   - Complete workflow test
   - 12-step process

6. **API Endpoint Tests**
   - All endpoints reachable
   - Proper authentication

7. **Cleanup**
   - Stop backend server
   - Generate summary

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║           eKYC Backend - E2E Test Suite                   ║
╚════════════════════════════════════════════════════════════╝

━━━ Step 1: Setting up test environment ━━━
━━━ Step 2: Waiting for services to stabilize ━━━
━━━ Step 3: Running unit tests ━━━
━━━ Step 4: Running integration tests ━━━
━━━ Step 5: Starting backend server ━━━
━━━ Step 6: Running demo flow (E2E) ━━━
━━━ Step 7: Running API endpoint tests ━━━
━━━ Step 8: Cleanup ━━━

╔════════════════════════════════════════════════════════════╗
║                    Test Summary                           ║
╚════════════════════════════════════════════════════════════╝

Unit Tests:        ✓ PASSED
Integration Tests: ✓ PASSED
E2E Demo Flow:     ✓ PASSED
API Tests:         ✓ PASSED

╔════════════════════════════════════════════════════════════╗
║          ALL TESTS PASSED SUCCESSFULLY! ✓                 ║
╚════════════════════════════════════════════════════════════╝
```

---

## Test Categories

### 1. Unit Tests

Test individual components in isolation.

```bash
# Run all unit tests
npm run test:unit

# Run specific tests
npm run test:models      # Model tests only
npm run test:blockchain  # Blockchain tests only

# Watch mode
npm run test:watch
```

**Coverage:**
- Models (User, KYCRequest, Credential, Consent, Bank)
- Services (blockchain, cache, queue)
- Middleware (auth, validation, error handling)
- Utilities (helpers, validators)

### 2. Integration Tests

Test API endpoints with real MongoDB (in-memory).

```bash
# Run all integration tests
npm run test:integration

# With coverage
npm test
```

**Test File:** `src/tests/api/integration.test.js`

**Coverage:**
- ✓ Authentication API (registration, login, refresh)
- ✓ KYC API (submit, status, history, credentials)
- ✓ Bank API (requests, verification, credential issuance)
- ✓ Consent API (create, grant, deny, revoke, bulk)
- ✓ Complete workflow test

### 3. E2E Tests

Test complete system with real services.

```bash
# Full E2E suite
npm run test:e2e

# With blockchain
npm run test:e2e:blockchain

# With clean database
npm run test:e2e:clean
```

**Coverage:**
- ✓ Docker services running
- ✓ Database connectivity
- ✓ API server startup
- ✓ Complete user workflow
- ✓ All endpoints accessible
- ✓ Data persistence

### 4. Demo Flow

Test realistic user workflow.

```bash
# Run demo flow
npm run demo

# Or directly
node scripts/demo-flow.js
```

**Workflow Steps:**
1. Create Bank (MongoDB direct)
2. Register Customer
3. Submit KYC Request
4. Create Consent Requests (3 types)
5. Grant Consents (bulk)
6. Register Bank Officer
7. Login Bank Officer
8. Get KYC Requests
9. Verify KYC Request
10. Issue Blockchain Credential
11. Retrieve Credentials
12. Check Final KYC Status

---

## Manual Testing

### Using npm Scripts

```bash
# 1. Setup environment
npm run setup:test

# 2. Start backend server (in separate terminal)
npm run dev

# 3. Run demo flow (in another terminal)
npm run demo

# 4. Run integration tests
npm run test:integration

# 5. Run all tests
npm run test:all
```

### Using cURL

#### Health Check
```bash
curl http://localhost:5000/health
```

#### Register Customer
```bash
curl -X POST http://localhost:5000/api/v1/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Test@123",
    "nid_number": "1234567890"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Test@123"
  }'
```

#### Submit KYC (with token)
```bash
TOKEN="your-access-token-here"

curl -X POST http://localhost:5000/api/v1/kyc/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nid_number": "1234567890",
    "full_name": "John Doe",
    "date_of_birth": "1990-01-15",
    "address": "123 Main St, Dhaka-1215, Bangladesh",
    "father_name": "Robert Doe",
    "mother_name": "Mary Doe",
    "phone": "01712345678"
  }'
```

### Using Postman

Import the API collection:

1. Download Postman collection (if available) or create manually
2. Set environment variables:
   - `base_url`: http://localhost:5000/api/v1
   - `access_token`: (set after login)
3. Run requests in sequence

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:7.0
        env:
          MONGO_INITDB_ROOT_USERNAME: admin
          MONGO_INITDB_ROOT_PASSWORD: eKYC_Admin_2025
        ports:
          - 27017:27017

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci

      - name: Install root dependencies
        run: npm ci

      - name: Run unit tests
        working-directory: ./backend
        run: npm run test:unit

      - name: Run integration tests
        working-directory: ./backend
        run: npm run test:integration

      - name: Start backend server
        working-directory: ./backend
        run: |
          npm run dev &
          sleep 10

      - name: Run E2E demo flow
        run: npm run demo

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: /tmp/*-test-results.txt
```

### GitLab CI Example

```yaml
stages:
  - test

e2e-tests:
  stage: test
  image: node:18

  services:
    - mongo:7.0
    - redis:7-alpine

  variables:
    MONGODB_URI: mongodb://admin:eKYC_Admin_2025@mongo:27017/ekyc_test_db?authSource=admin
    REDIS_HOST: redis

  script:
    - cd backend
    - npm ci
    - npm run test:unit
    - npm run test:integration
    - npm run dev &
    - sleep 10
    - cd ..
    - npm ci
    - npm run demo

  artifacts:
    when: always
    paths:
      - /tmp/*-test-results.txt
```

---

## Troubleshooting

### Issue 1: Docker not running

**Error:**
```
✗ Docker is not running. Please start Docker first.
```

**Solution:**
```bash
# Start Docker Desktop (GUI) or
sudo systemctl start docker
```

### Issue 2: Port already in use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
export PORT=5001
```

### Issue 3: MongoDB connection failed

**Error:**
```
MongoServerError: Authentication failed
```

**Solution:**
```bash
# Stop and restart MongoDB
docker-compose down
docker-compose up -d mongodb

# Verify credentials in .env match docker-compose.yml
```

### Issue 4: Tests failing intermittently

**Solution:**
```bash
# Clean database and restart
npm run test:e2e:clean

# Increase wait times in scripts if network is slow
# Edit scripts/run-e2e-tests.sh and increase MAX_WAIT
```

### Issue 5: Hardhat blockchain not starting

**Solution:**
```bash
# Check if blockchain directory exists
ls -la ../blockchain

# Install dependencies
cd ../blockchain
npm install

# Try starting manually
npx hardhat node
```

### Issue 6: Permission denied on scripts

**Error:**
```bash
bash: ./scripts/run-e2e-tests.sh: Permission denied
```

**Solution:**
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### Issue 7: Rate limiting errors

**Error:**
```
Too many requests from this IP, please try again later
```

**Solution:**
```bash
# Increase rate limits in .env.test
RATE_LIMIT_MAX_REQUESTS=1000

# Or wait for rate limit window to reset (15 minutes default)
```

---

## Test Logs and Reports

All test logs are saved to `/tmp/` for analysis:

```bash
# View unit test results
cat /tmp/unit-test-results.txt

# View integration test results
cat /tmp/integration-test-results.txt

# View E2E demo results
cat /tmp/e2e-test-results.txt

# View backend server logs
cat /tmp/backend-server.log

# View Hardhat logs (if using blockchain)
cat /tmp/hardhat.log
```

---

## Best Practices

### 1. Before Each Test Run
- ✓ Ensure Docker is running
- ✓ Stop any running backend servers
- ✓ Clean database if needed
- ✓ Check available disk space

### 2. During Development
- ✓ Run unit tests frequently (`npm run test:watch`)
- ✓ Run integration tests before commits
- ✓ Run E2E tests before push
- ✓ Keep test coverage above 80%

### 3. In CI/CD
- ✓ Run all test categories
- ✓ Upload test artifacts
- ✓ Fail build on test failures
- ✓ Generate coverage reports

### 4. Test Data Management
- ✓ Use unique data for each test run (timestamps, random values)
- ✓ Clean up test data after tests
- ✓ Don't hardcode sensitive data
- ✓ Use environment variables

---

## Quick Reference Commands

```bash
# Setup
npm run setup:test                    # Setup test environment
npm run setup:test:blockchain         # Setup with blockchain

# Run Tests
npm run test:unit                     # Unit tests
npm run test:integration              # Integration tests
npm run test:e2e                      # Full E2E suite
npm run test:e2e:blockchain          # E2E with blockchain
npm run test:e2e:clean               # E2E with clean DB
npm run test:all                      # All tests

# Demo
npm run demo                          # Run demo flow

# Cleanup
docker-compose down                   # Stop Docker services
kill $(cat /tmp/backend-server.pid)  # Stop backend server
kill $(cat /tmp/hardhat.pid)         # Stop Hardhat node
```

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review test logs in `/tmp/`
3. Check API documentation in `API_DOCUMENTATION.md`
4. Verify environment setup in `.env.test`

Happy Testing! 🚀
