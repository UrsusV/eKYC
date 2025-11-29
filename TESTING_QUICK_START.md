# Testing Quick Start Guide

Fast guide to run end-to-end tests on the eKYC blockchain backend.

## TL;DR - Run Full E2E Tests

```bash
cd backend
npm run test:e2e
```

That's it! This single command will:
- ✅ Setup Docker (MongoDB + Redis)
- ✅ Run all tests (unit, integration, E2E)
- ✅ Generate test report
- ✅ Cleanup

---

## All Testing Commands

### Quick Commands

| Command | Description | Time |
|---------|-------------|------|
| `npm run test:e2e` | Full E2E test suite | ~3-5 min |
| `npm run test:unit` | Unit tests only | ~30 sec |
| `npm run test:integration` | Integration tests | ~1 min |
| `npm run demo` | Demo workflow | ~30 sec |
| `npm run test:all` | All tests sequentially | ~5-7 min |

### Setup Commands

| Command | Description |
|---------|-------------|
| `npm run setup:test` | Setup test environment (MongoDB + Redis) |
| `npm run setup:test:blockchain` | Setup with Hardhat blockchain |

### Advanced E2E Options

```bash
# E2E with blockchain
npm run test:e2e:blockchain

# E2E with clean database
npm run test:e2e:clean

# Skip environment setup (use existing services)
./scripts/run-e2e-tests.sh --skip-setup
```

---

## Manual Step-by-Step Testing

### Terminal 1: Start Services
```bash
# Start Docker services
cd backend
npm run setup:test

# Or with blockchain
npm run setup:test:blockchain
```

### Terminal 2: Start Backend
```bash
cd backend
npm run dev
```

### Terminal 3: Run Tests
```bash
# Run demo flow
npm run demo

# Or run integration tests
cd backend
npm run test:integration

# Or run all tests
npm run test:all
```

---

## What Gets Tested?

### ✅ Unit Tests (30+ tests)
- User, KYC, Consent, Bank models
- Blockchain service
- Validators
- Middleware

### ✅ Integration Tests (40+ tests)
- **Auth API**: Register, login, refresh, profile
- **KYC API**: Submit, status, history, credentials
- **Bank API**: Requests, verification, issuance
- **Consent API**: Create, grant, deny, revoke, bulk
- **Complete workflow**: End-to-end user journey

### ✅ E2E Demo Flow (12 steps)
1. Create Bank
2. Register Customer
3. Submit KYC
4. Create Consents (3 types)
5. Grant Consents (bulk)
6. Register Bank Officer
7. Login Officer
8. Get KYC Requests
9. Verify KYC
10. Issue Credential
11. Retrieve Credentials
12. Check Final Status

### ✅ API Endpoint Tests
- All endpoints reachable
- Proper authentication
- Error handling

---

## Requirements

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** (running)
- **Docker Compose**

### Quick Check
```bash
node --version    # Should be >= 18
npm --version     # Should be >= 9
docker --version  # Should show version
docker info       # Should not error
```

---

## Expected Output

### Successful E2E Test Run
```
╔════════════════════════════════════════════════════════════╗
║           eKYC Backend - E2E Test Suite                   ║
╚════════════════════════════════════════════════════════════╝

━━━ Step 1: Setting up test environment ━━━
✓ Docker is running
✓ MongoDB and Redis started
✓ Services ready

━━━ Step 2: Running unit tests ━━━
✓ Unit tests passed

━━━ Step 3: Running integration tests ━━━
✓ Integration tests passed

━━━ Step 4: Starting backend server ━━━
✓ Backend server is running

━━━ Step 5: Running demo flow (E2E) ━━━
✓ E2E demo flow passed

━━━ Step 6: Running API endpoint tests ━━━
✓ API endpoint tests passed

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

## Common Issues & Fixes

### 1. Docker not running
```bash
# Start Docker Desktop or
sudo systemctl start docker
```

### 2. Port already in use
```bash
# Kill process on port 5000
lsof -i :5000
kill -9 <PID>
```

### 3. Permission denied
```bash
# Make scripts executable
chmod +x backend/scripts/*.sh
```

### 4. MongoDB connection failed
```bash
# Restart Docker services
docker-compose down
docker-compose up -d mongodb redis
```

---

## Test Logs

All logs saved to `/tmp/`:
```bash
cat /tmp/unit-test-results.txt
cat /tmp/integration-test-results.txt
cat /tmp/e2e-test-results.txt
cat /tmp/backend-server.log
```

---

## Full Documentation

For detailed documentation, see:
- **[E2E Testing Guide](backend/E2E_TESTING_GUIDE.md)** - Complete testing guide
- **[API Documentation](backend/API_DOCUMENTATION.md)** - API reference
- **[Quick Start](backend/QUICK_START.md)** - Project setup guide

---

## Quick Development Workflow

```bash
# 1. Start development
npm run setup:test          # Setup once
cd backend && npm run dev   # Start server

# 2. Make changes to code

# 3. Run tests
npm run test:unit           # Fast feedback
npm run test:integration    # API tests
npm run demo                # Full workflow

# 4. Before commit
npm run test:all            # All tests
npm run lint                # Check code style

# 5. Cleanup
docker-compose down         # Stop services
```

---

## CI/CD Ready

All scripts work in CI/CD environments:
- ✅ GitHub Actions
- ✅ GitLab CI
- ✅ Jenkins
- ✅ CircleCI

Example CI command:
```bash
npm run test:all
```

---

**Happy Testing! 🚀**

For help: See [E2E_TESTING_GUIDE.md](backend/E2E_TESTING_GUIDE.md)
