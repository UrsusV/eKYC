#!/bin/bash

###############################################################################
# End-to-End Testing Script
# Runs complete E2E tests including setup, tests, and teardown
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           eKYC Backend - E2E Test Suite                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
WITH_BLOCKCHAIN=false
CLEAN_DB=false
SKIP_SETUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--with-blockchain)
            WITH_BLOCKCHAIN=true
            shift
            ;;
        -c|--clean-db)
            CLEAN_DB=true
            shift
            ;;
        -s|--skip-setup)
            SKIP_SETUP=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -b, --with-blockchain  Start Hardhat blockchain node"
            echo "  -c, --clean-db         Clean test database before running"
            echo "  -s, --skip-setup       Skip environment setup (use existing services)"
            exit 1
            ;;
    esac
done

# Change to backend directory
cd "$(dirname "$0")/.." || exit

# Step 1: Setup environment
if [ "$SKIP_SETUP" = false ]; then
    echo -e "${BLUE}━━━ Step 1: Setting up test environment ━━━${NC}"

    SETUP_ARGS=""
    [ "$WITH_BLOCKCHAIN" = true ] && SETUP_ARGS="$SETUP_ARGS --with-blockchain"
    [ "$CLEAN_DB" = true ] && SETUP_ARGS="$SETUP_ARGS --clean-db"

    ./scripts/setup-test-env.sh $SETUP_ARGS

    echo ""
else
    echo -e "${YELLOW}⚠ Skipping environment setup${NC}"
fi

# Step 2: Wait for services to stabilize
echo -e "${BLUE}━━━ Step 2: Waiting for services to stabilize ━━━${NC}"
sleep 2
echo -e "${GREEN}✓ Services ready${NC}"
echo ""

# Step 3: Run unit tests
echo -e "${BLUE}━━━ Step 3: Running unit tests ━━━${NC}"
npm run test:unit 2>&1 | tee /tmp/unit-test-results.txt
UNIT_EXIT_CODE=${PIPESTATUS[0]}

if [ $UNIT_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Unit tests passed${NC}"
else
    echo -e "${RED}✗ Unit tests failed${NC}"
fi
echo ""

# Step 4: Run integration tests
echo -e "${BLUE}━━━ Step 4: Running integration tests ━━━${NC}"
npm run test:integration 2>&1 | tee /tmp/integration-test-results.txt
INTEGRATION_EXIT_CODE=${PIPESTATUS[0]}

if [ $INTEGRATION_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ Integration tests passed${NC}"
else
    echo -e "${RED}✗ Integration tests failed${NC}"
fi
echo ""

# Step 5: Start backend server for E2E tests
echo -e "${BLUE}━━━ Step 5: Starting backend server ━━━${NC}"

# Use test environment
export NODE_ENV=test
export PORT=5001

# Start server in background
npm run dev > /tmp/backend-server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > /tmp/backend-server.pid

echo -e "${YELLOW}Server starting... (PID: $SERVER_PID)${NC}"

# Wait for server to be ready
MAX_WAIT=30
WAITED=0
until curl -s http://localhost:5001/health > /dev/null 2>&1; do
    sleep 1
    WAITED=$((WAITED + 1))
    if [ $WAITED -ge $MAX_WAIT ]; then
        echo -e "${RED}✗ Server failed to start within ${MAX_WAIT} seconds${NC}"
        echo -e "${YELLOW}Server logs:${NC}"
        tail -20 /tmp/backend-server.log
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
done

echo -e "${GREEN}✓ Backend server is running${NC}"
echo ""

# Step 6: Run demo flow (E2E test)
echo -e "${BLUE}━━━ Step 6: Running demo flow (E2E) ━━━${NC}"
cd .. || exit
node scripts/demo-flow.js 2>&1 | tee /tmp/e2e-test-results.txt
E2E_EXIT_CODE=${PIPESTATUS[0]}

if [ $E2E_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ E2E demo flow passed${NC}"
else
    echo -e "${RED}✗ E2E demo flow failed${NC}"
fi
echo ""

# Step 7: Run API endpoint tests
echo -e "${BLUE}━━━ Step 7: Running API endpoint tests ━━━${NC}"
cd backend || exit

# Create a simple API test script
cat > /tmp/test-api-endpoints.js << 'EOF'
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api/v1';
let passed = 0;
let failed = 0;

async function testEndpoint(method, url, expectedStatus, description) {
    try {
        const response = await axios({
            method,
            url: `${API_BASE}${url}`,
            validateStatus: () => true
        });

        if (response.status === expectedStatus) {
            console.log(`✓ ${description}`);
            passed++;
        } else {
            console.log(`✗ ${description} (expected ${expectedStatus}, got ${response.status})`);
            failed++;
        }
    } catch (error) {
        console.log(`✗ ${description} (error: ${error.message})`);
        failed++;
    }
}

async function runTests() {
    console.log('Testing API endpoints...\n');

    // Health check
    await testEndpoint('GET', '/../health', 200, 'Health check endpoint');

    // Auth endpoints (should fail without data but should exist)
    await testEndpoint('POST', '/auth/register/customer', 400, 'Customer registration endpoint exists');
    await testEndpoint('POST', '/auth/register/bank-officer', 400, 'Bank officer registration endpoint exists');
    await testEndpoint('POST', '/auth/login', 400, 'Login endpoint exists');

    // Protected endpoints (should return 401 without auth)
    await testEndpoint('GET', '/auth/me', 401, 'Get current user requires auth');
    await testEndpoint('POST', '/kyc/submit', 401, 'KYC submission requires auth');
    await testEndpoint('GET', '/kyc/history', 401, 'KYC history requires auth');
    await testEndpoint('GET', '/bank/kyc-requests', 401, 'Bank KYC requests requires auth');
    await testEndpoint('GET', '/consent/my-consents', 401, 'Consent listing requires auth');

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
EOF

node /tmp/test-api-endpoints.js
API_TEST_EXIT_CODE=$?

if [ $API_TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ API endpoint tests passed${NC}"
else
    echo -e "${RED}✗ Some API endpoint tests failed${NC}"
fi
echo ""

# Step 8: Cleanup
echo -e "${BLUE}━━━ Step 8: Cleanup ━━━${NC}"

# Stop backend server
if [ -f /tmp/backend-server.pid ]; then
    SERVER_PID=$(cat /tmp/backend-server.pid)
    echo "Stopping backend server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
    rm /tmp/backend-server.pid
fi

echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Generate summary
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Test Summary                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

OVERALL_SUCCESS=true

if [ $UNIT_EXIT_CODE -eq 0 ]; then
    echo -e "Unit Tests:        ${GREEN}✓ PASSED${NC}"
else
    echo -e "Unit Tests:        ${RED}✗ FAILED${NC}"
    OVERALL_SUCCESS=false
fi

if [ $INTEGRATION_EXIT_CODE -eq 0 ]; then
    echo -e "Integration Tests: ${GREEN}✓ PASSED${NC}"
else
    echo -e "Integration Tests: ${RED}✗ FAILED${NC}"
    OVERALL_SUCCESS=false
fi

if [ $E2E_EXIT_CODE -eq 0 ]; then
    echo -e "E2E Demo Flow:     ${GREEN}✓ PASSED${NC}"
else
    echo -e "E2E Demo Flow:     ${RED}✗ FAILED${NC}"
    OVERALL_SUCCESS=false
fi

if [ $API_TEST_EXIT_CODE -eq 0 ]; then
    echo -e "API Tests:         ${GREEN}✓ PASSED${NC}"
else
    echo -e "API Tests:         ${RED}✗ FAILED${NC}"
    OVERALL_SUCCESS=false
fi

echo ""
echo -e "${CYAN}Log Files:${NC}"
echo "  • Unit tests:       /tmp/unit-test-results.txt"
echo "  • Integration:      /tmp/integration-test-results.txt"
echo "  • E2E demo:         /tmp/e2e-test-results.txt"
echo "  • Backend server:   /tmp/backend-server.log"
echo ""

if [ "$OVERALL_SUCCESS" = true ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ALL TESTS PASSED SUCCESSFULLY! ✓                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              SOME TESTS FAILED ✗                          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
