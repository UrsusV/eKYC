/**
 * Demo Flow Script
 * Tests the complete KYC workflow from registration to credential issuance
 *
 * Run with: node scripts/demo-flow.js
 */

require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5001";
const API_VERSION = process.env.API_VERSION || "v1";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

// Helper functions
const printSection = (title) => {
  console.log("\n" + "=".repeat(60));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log("=".repeat(60));
};

const printSuccess = (message) => {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
};

const printError = (message) => {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
};

const printInfo = (message) => {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
};

const printData = (label, data) => {
  console.log(
    `${colors.yellow}${label}:${colors.reset}`,
    JSON.stringify(data, null, 2)
  );
};

// API client
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Demo data
const timestamp = Date.now();
const customerNid = String(Math.floor(Math.random() * 9000000000) + 1000000000);

let customerData = {
  name: "John Doe",
  email: `customer_${timestamp}@example.com`,
  password: "Customer@123",
  nid_number: customerNid,
};

let bankData = {
  name: "Demo Bank Ltd",
  swift_code: "DEMOBDXXX",
  routing_number: "123456789",
  head_office_address: "Motijheel, Dhaka-1000, Bangladesh",
  phone: "+8801700000000",
  email: "info@demobank.com",
  website: "https://demobank.com",
};

let bankOfficerData = {
  name: "Jane Smith",
  email: `officer_${timestamp}@example.com`,
  password: "Officer@123",
  bank_id: null, // Will be set after creating bank
  officer_id: "OFF" + Math.floor(Math.random() * 100000),
};

let kycSubmissionData = {
  nid_number: customerNid,
  full_name: "John Doe",
  date_of_birth: "1990-01-15",
  address: "123 Main Street, Dhaka-1215, Bangladesh",
  father_name: "Robert Doe",
  mother_name: "Mary Doe",
  phone: "01712345678",
};

// Store tokens and IDs
let customerToken = "";
let bankOfficerToken = "";
let kycRequestId = "";
let credentialId = "";
let bankId = "";
let consentIds = [];

/**
 * Check if server is running
 */
async function checkServer() {
  try {
    await axios.get(`${API_BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Step 0: Create a bank (required for bank officer registration)
 */
async function createBank() {
  printSection("Step 0: Create Bank");

  try {
    // Connect to MongoDB directly to create a bank
    const Bank = mongoose.model(
      "Bank",
      new mongoose.Schema({
        name: String,
        swift_code: String,
        routing_number: String,
        head_office_address: String,
        phone: String,
        email: String,
        website: String,
        isActive: { type: Boolean, default: true },
      })
    );

    // Try to find existing bank or create new
    let bank = await Bank.findOne({ swift_code: bankData.swift_code });

    if (!bank) {
      bank = new Bank({ ...bankData, isActive: true });
      await bank.save();
      printInfo("New bank created");
    } else {
      // Ensure existing bank is active
      if (!bank.isActive) {
        bank.isActive = true;
        await bank.save();
      }
      printInfo("Using existing bank");
    }

    bankId = bank._id.toString();
    bankOfficerData.bank_id = bankId;

    printSuccess("Bank created successfully");
    printData("Bank", {
      id: bank._id,
      name: bank.name,
      swift_code: bank.swift_code,
    });

    return true;
  } catch (error) {
    printError("Bank creation failed");
    printData("Error", error.message);
    return false;
  }
}

/**
 * Step 1: Register a customer
 */
async function registerCustomer() {
  printSection("Step 1: Register Customer");

  try {
    const response = await api.post("/auth/register/customer", customerData);
    customerToken = response.data.data.accessToken;

    printSuccess("Customer registered successfully");
    printData("Customer", {
      id: response.data.data.user.id,
      email: response.data.data.user.email,
      fullName: response.data.data.user.fullName,
      role: response.data.data.user.role,
    });
    printInfo(`Access Token: ${customerToken.substring(0, 20)}...`);

    return true;
  } catch (error) {
    printError("Customer registration failed");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 2: Customer submits KYC request
 */
async function submitKycRequest() {
  printSection("Step 2: Customer Submits KYC Request");

  try {
    const response = await api.post("/kyc/submit", kycSubmissionData, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    kycRequestId = response.data.data._id;

    printSuccess("KYC request submitted successfully");
    printData("KYC Request", {
      id: response.data.data._id,
      requestId: response.data.data.requestId,
      status: response.data.data.status,
      kycLevel: response.data.data.kycLevel,
      submittedAt: response.data.data.createdAt,
    });
    printInfo(`KYC submitted to bank: ${bankId}`);

    return true;
  } catch (error) {
    printError("KYC submission failed");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 2.5: Create consent requests for the KYC
 */
async function createConsentRequests() {
  printSection("Step 2.5: Create Consent Requests");

  try {
    if (!kycRequestId) {
      printError("KYC request ID is required to create consents");
      return false;
    }

    const consentTypes = [
      {
        consentType: "data_collection",
        purpose:
          "To collect and verify your personal information for KYC compliance and regulatory requirements",
        dataCategories: ["personal_info", "contact_info", "identification"],
      },
      {
        consentType: "data_processing",
        purpose:
          "To process your personal data for identity verification, risk assessment, and fraud prevention",
        dataCategories: ["personal_info", "identification", "financial"],
      },
      {
        consentType: "blockchain_storage",
        purpose:
          "To store your verified credentials on a secure blockchain network for immutable record-keeping and future verification",
        dataCategories: ["identification"],
      },
    ];

    printInfo(`Creating ${consentTypes.length} consent requests...`);

    const createdConsents = [];

    for (const consent of consentTypes) {
      const response = await api.post(
        "/consent/create",
        {
          kycRequestId: kycRequestId,
          ...consent,
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        }
      );

      createdConsents.push(response.data.data);
    }

    printSuccess(
      `${createdConsents.length} consent requests created successfully`
    );

    createdConsents.forEach((consent, index) => {
      printData(`Consent ${index + 1}`, {
        consentId: consent.consentId,
        type: consent.consentType,
        status: consent.status,
        mandatory: consent.isMandatory,
      });
    });

    consentIds = createdConsents.map((c) => c._id);

    return true;
  } catch (error) {
    printError("Consent request creation failed");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 2.7: Grant all required consents
 */
async function grantConsents() {
  printSection("Step 2.7: Grant Required Consents");

  try {
    if (consentIds.length === 0) {
      printError("No consents to grant");
      return false;
    }

    printInfo(`Granting ${consentIds.length} consent(s)...`);

    // Bulk grant all consents
    const grantResponse = await api.post(
      "/consent/bulk-grant",
      {
        consentIds: consentIds,
        agreed: true,
      },
      {
        headers: { Authorization: `Bearer ${customerToken}` },
      }
    );

    printSuccess(
      `${grantResponse.data.data.grantedCount} consent(s) granted successfully`
    );

    printData(
      "Granted Consents",
      grantResponse.data.data.consents.map((c) => ({
        consentId: c.consentId,
        type: c.consentType,
        status: c.status,
      }))
    );

    return true;
  } catch (error) {
    printError("Consent granting failed");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 3: Register a bank officer
 */
async function registerBankOfficer() {
  printSection("Step 3: Register Bank Officer");

  try {
    const response = await api.post(
      "/auth/register/bank-officer",
      bankOfficerData
    );
    bankOfficerToken = response.data.data.accessToken;

    printSuccess("Bank officer registered successfully");
    printData("Bank Officer", {
      id: response.data.data.user.id,
      email: response.data.data.user.email,
      fullName: response.data.data.user.fullName,
      role: response.data.data.user.role,
    });
    printInfo(`Access Token: ${bankOfficerToken.substring(0, 20)}...`);

    return true;
  } catch (error) {
    printError("Bank officer registration failed");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 4: Bank officer logs in
 */
async function loginBankOfficer() {
  printSection("Step 4: Bank Officer Login");

  try {
    const response = await api.post("/auth/login", {
      email: bankOfficerData.email,
      password: bankOfficerData.password,
    });

    bankOfficerToken = response.data.data.accessToken;

    printSuccess("Bank officer logged in successfully");
    printInfo(`New Access Token: ${bankOfficerToken.substring(0, 20)}...`);

    return true;
  } catch (error) {
    printError("Bank officer login failed");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 5: Bank officer retrieves KYC requests
 */
async function getKycRequests() {
  printSection("Step 5: Bank Officer Retrieves KYC Requests");

  try {
    const response = await api.get("/bank/kyc-requests?status=all", {
      headers: { Authorization: `Bearer ${bankOfficerToken}` },
    });

    printSuccess("KYC requests retrieved successfully");
    printData("Total Requests", response.data.data.pagination.total);
    printInfo(`Bank officer's bank: ${bankId}`);

    if (response.data.data.requests.length > 0) {
      printData("First Request", {
        id: response.data.data.requests[0]._id,
        requestId: response.data.data.requests[0].requestId,
        customerName: response.data.data.requests[0].customerName,
        status: response.data.data.requests[0].status,
        submissionDate: response.data.data.requests[0].submissionDate,
      });
    }

    return true;
  } catch (error) {
    printError("Failed to retrieve KYC requests");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 6: Bank officer verifies (approves) KYC request
 */
async function verifyKycRequest() {
  printSection("Step 6: Bank Officer Verifies KYC Request");

  try {
    const response = await api.post(
      `/bank/verify/${kycRequestId}`,
      {
        approved: true,
        comments:
          "All documents and information have been verified successfully. Identity confirmed through NID verification.",
      },
      {
        headers: { Authorization: `Bearer ${bankOfficerToken}` },
      }
    );

    printSuccess("KYC request verified successfully");
    printData("Verification Result", {
      id: response.data.data._id,
      requestId: response.data.data.requestId,
      status: response.data.data.status,
      verifiedAt: response.data.data.workflow?.completedAt,
      comments: response.data.data.workflow?.comments,
    });

    return true;
  } catch (error) {
    printError("KYC verification failed");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 7: Bank officer issues credential on blockchain
 */
async function issueCredential() {
  printSection("Step 7: Bank Officer Issues Blockchain Credential");

  try {
    const response = await api.post(
      "/bank/issue-credential",
      {
        requestId: kycRequestId,
      },
      {
        headers: { Authorization: `Bearer ${bankOfficerToken}` },
      }
    );

    credentialId = response.data.data.credential?._id || response.data.data._id;

    printSuccess("Blockchain credential issued successfully");

    if (response.data.data.credential) {
      printData("Credential", {
        id: response.data.data.credential._id,
        credentialId: response.data.data.credential.credentialId,
        transactionHash: response.data.data.credential.transactionHash,
        blockNumber: response.data.data.credential.blockNumber,
        status: response.data.data.credential.status,
        issuedAt: response.data.data.credential.issuedAt,
      });
    } else {
      printData("Response", response.data.data);
    }

    return true;
  } catch (error) {
    printError("Credential issuance failed");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 8: Customer retrieves credentials
 */
async function retrieveCredentials() {
  printSection("Step 8: Customer Retrieves Credentials");

  try {
    const response = await api.get("/kyc/credentials", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    printSuccess("Credentials retrieved successfully");
    printData("Total Credentials", response.data.data.length);

    if (response.data.data.length > 0) {
      const credential = response.data.data[0];
      printData("Latest Credential", {
        id: credential._id,
        credentialId: credential.credentialId,
        status: credential.status,
        transactionHash: credential.transactionHash,
        issuedAt: credential.issuedAt,
      });
    }

    return true;
  } catch (error) {
    printError("Failed to retrieve credentials");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 9: Check final KYC status
 */
async function checkKycStatus() {
  printSection("Step 9: Check Final KYC Status");

  try {
    const response = await api.get(`/kyc/status/${kycRequestId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });

    printSuccess("KYC status retrieved successfully");
    printData("Final Status", {
      id: response.data.data._id,
      requestId: response.data.data.requestId,
      status: response.data.data.status,
      kycLevel: response.data.data.kycLevel,
      submittedAt: response.data.data.createdAt,
      completedAt: response.data.data.workflow?.completedAt,
      hasCredential: !!response.data.data.credentialId,
    });

    return true;
  } catch (error) {
    printError("Failed to check KYC status");
    printData("Error", error.response?.data || error.message);
    return false;
  }
}

/**
 * Main demo flow
 */
async function runDemo() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║          eKYC Blockchain System - Demo Flow               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(colors.reset);

  printInfo(`API Base URL: ${API_BASE_URL}`);
  printInfo(`API Version: ${API_VERSION}`);
  printInfo(`Start Time: ${new Date().toISOString()}`);

  // Check if server is running
  printInfo("Checking if backend server is running...");
  const serverRunning = await checkServer();

  if (!serverRunning) {
    printError("Backend server is not running!");
    console.log(
      `\n${colors.yellow}Please start the backend server first:${colors.reset}`
    );
    console.log(`  ${colors.cyan}cd backend && npm run dev${colors.reset}\n`);
    process.exit(1);
  }

  printSuccess("Backend server is running");
  console.log("");

  // Connect to MongoDB for bank creation
  if (mongoose.connection.readyState === 0) {
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_db?authSource=admin";
    await mongoose.connect(mongoUri);
    printInfo("Connected to MongoDB");
  }

  const steps = [
    { name: "Create Bank", fn: createBank },
    { name: "Register Customer", fn: registerCustomer },
    { name: "Submit KYC Request", fn: submitKycRequest },
    { name: "Create Consent Requests", fn: createConsentRequests },
    { name: "Grant Consents", fn: grantConsents },
    { name: "Register Bank Officer", fn: registerBankOfficer },
    { name: "Login Bank Officer", fn: loginBankOfficer },
    { name: "Get KYC Requests", fn: getKycRequests },
    { name: "Verify KYC Request", fn: verifyKycRequest },
    { name: "Issue Blockchain Credential", fn: issueCredential },
    { name: "Retrieve Credentials", fn: retrieveCredentials },
    { name: "Check Final KYC Status", fn: checkKycStatus },
  ];

  let successCount = 0;
  let failureCount = 0;

  for (const step of steps) {
    try {
      const success = await step.fn();
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      // Small delay between steps
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      failureCount++;
      printError(`Unexpected error in ${step.name}: ${error.message}`);
    }
  }

  // Summary
  printSection("Demo Summary");
  console.log(
    `${colors.green}Successful Steps: ${successCount}/${
      steps.length
    } (${Math.round((successCount / steps.length) * 100)}%)${colors.reset}`
  );
  console.log(
    `${colors.red}Failed Steps: ${failureCount}/${steps.length}${colors.reset}`
  );
  printInfo(`End Time: ${new Date().toISOString()}`);

  if (successCount === steps.length) {
    console.log(
      `\n${colors.bright}${colors.green}✓ All steps completed successfully!${colors.reset}\n`
    );
  } else {
    console.log(
      `\n${colors.bright}${colors.yellow}⚠ Some steps failed. Check the logs above.${colors.reset}\n`
    );
  }

  // Close database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

// Run the demo
if (require.main === module) {
  runDemo()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      printError(`Demo failed: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runDemo };
