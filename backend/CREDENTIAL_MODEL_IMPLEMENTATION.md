# Credential Model Implementation Summary

## Overview
This document summarizes the implementation of the Credential model and related fixes to make the backend fully ready for frontend integration.

## Changes Made

### 1. Created Credential Model
**File:** `src/models/Credential.js`

A comprehensive Mongoose model for storing blockchain-issued credentials with the following features:

#### Key Fields:
- **credentialId**: Unique identifier (auto-generated format: `CRED-{timestamp}-{random}`)
- **userId**: Reference to User who owns the credential
- **kycRequestId**: Reference to the KYC request that generated this credential
- **bankId**: Reference to the issuing bank
- **issuedBy**: Reference to the bank officer who issued it
- **credentialType**: Type of credential (identity_verification, address_verification, etc.)

#### Blockchain Data:
- **credentialHash**: SHA-256 hash of credential data
- **transactionHash**: Ethereum transaction hash
- **blockNumber**: Block where credential was recorded
- **holderAddress**: User's blockchain wallet address
- **issuerAddress**: Bank's blockchain wallet address
- **blockchainCredentialId**: ID returned from smart contract
- **networkId**: Blockchain network identifier
- **gasUsed**: Gas consumed for the transaction

#### Status Management:
- **status**: pending, active, revoked, expired, suspended
- **issuedAt**: Timestamp when issued
- **expiresAt**: Expiration date (default: 1 year)

#### Advanced Features:
- **Revocation support**: Full revocation tracking with reason and details
- **Access control**: Grant temporary access to other users
- **Audit trail**: Complete history of all actions on credential
- **Usage statistics**: Track views and verifications
- **Virtual properties**: `isExpired`, `isValid`, `daysUntilExpiry`

#### Instance Methods:
- `revoke(revokedBy, reason, details, txHash)` - Revoke a credential
- `grantAccess(userId, purpose, duration)` - Grant access to another user
- `recordVerification(verifiedBy)` - Track verification events
- `recordAccess(accessedBy, ipAddress, userAgent)` - Track access events

#### Static Methods:
- `findActive(userId)` - Get all active credentials for a user
- `findExpiringSoon(days)` - Find credentials expiring within N days

### 2. Updated Bank Controller
**File:** `src/controllers/bankController.js`

Modified the `issueCredential` function to:
- Create a Credential record in the database after issuing to blockchain
- Calculate expiry date (1 year from issuance)
- Store comprehensive blockchain transaction details
- Include credential data (name, DOB, nationality, KYC level)
- Track verification proof and documents verified
- Return both credential and transaction information

**Response Format:**
```json
{
  "success": true,
  "message": "Blockchain credential issued successfully",
  "data": {
    "credential": {
      "_id": "...",
      "credentialId": "CRED-1700654400000-ABC123",
      "userId": "...",
      "kycRequestId": "...",
      "credentialType": "identity_verification",
      "status": "active",
      "issuedAt": "2024-11-29T...",
      "expiresAt": "2025-11-29T..."
    },
    "transaction": {
      "transactionHash": "0x...",
      "blockNumber": 12345,
      "blockchainCredentialId": "0x...",
      "gasUsed": "250000"
    }
  }
}
```

### 3. Updated KYC Controller
**File:** `src/controllers/kycController.js`

Modified the `getCredentials` function to:
- Fetch credentials from the Credential model instead of KycRequest
- Return comprehensive credential information
- Include virtual properties (isExpired, isValid)
- Support status filtering (active, revoked, expired, all)
- Provide pagination support

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "credentialId": "CRED-1700654400000-ABC123",
      "userId": "...",
      "kycRequestId": "...",
      "requestId": "KYC-123",
      "credentialType": "identity_verification",
      "status": "active",
      "transactionHash": "0x...",
      "blockNumber": 12345,
      "credentialHash": "0x...",
      "blockchainCredentialId": "0x...",
      "issuedAt": "2024-11-29T...",
      "expiresAt": "2025-11-29T...",
      "isExpired": false,
      "isValid": true,
      "kycLevel": 1,
      "bank": {
        "name": "Central Bank",
        "code": "CNTB"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasMore": false
  }
}
```

### 4. Updated Models Index
**File:** `src/models/index.js`

Added exports for:
- Credential model
- Consent model (was missing)

### 5. Fixed Blockchain Tests
**File:** `src/services/blockchain/__tests__/mocks/fs.mock.js`

Enhanced the file system mock to:
- Return mock artifact for any file path
- Add additional fs.promises methods (writeFile, mkdir, access, stat)
- Ensure proper mocking of artifact loading in tests

### 6. Updated Integration Tests
**File:** `src/tests/api/integration.test.js`

- Uncommented Credential model import
- Added Credential cleanup in beforeEach hook
- Tests now properly clean up credential data between runs

### 7. Fixed Index Warnings

Removed duplicate indexes in Credential model that were defined both with `index: true` in field definitions and in `schema.index()` calls. Now only composite indexes are defined explicitly.

## Benefits of the New Implementation

### For Frontend Developers:

1. **Clear Data Structure**: Credentials are now separate entities with their own lifecycle
2. **Rich Information**: Frontend gets comprehensive credential data including:
   - Expiration status
   - Validity checks
   - Blockchain transaction details
   - Audit trail
3. **Better UX**: Can show users when credentials are expiring, revoked, or invalid
4. **Access Control**: Support for granting temporary access to credentials

### For Backend:

1. **Separation of Concerns**: Credentials are independent of KYC requests
2. **Audit Trail**: Complete history of all credential operations
3. **Easy Queries**: Efficient indexes for common queries
4. **Lifecycle Management**: Built-in expiration, revocation, and validation
5. **Usage Tracking**: Know how often credentials are viewed/verified

## Database Schema

The Credential model creates the following indexes for optimal query performance:

```javascript
{ userId: 1, status: 1 }              // User's credentials by status
{ kycRequestId: 1, status: 1 }        // KYC request credentials
{ status: 1, expiresAt: 1 }           // Active credentials by expiry
{ issuedAt: -1 }                      // Recent credentials first
```

Individual field indexes on:
- credentialId (unique)
- blockchain.credentialHash (unique)
- blockchain.transactionHash (unique)
- blockchain.blockNumber
- userId
- kycRequestId
- bankId
- expiresAt
- status

## API Changes Summary

### Modified Endpoints:

#### POST /api/v1/bank/issue-credential
**Before:** Returned KYC request with blockchain data
**After:** Returns both Credential object and transaction details

#### GET /api/v1/kyc/credentials
**Before:** Queried KYC requests with blockchain data
**After:** Queries Credential model with full credential lifecycle info

## Testing Status

✅ **Integration Tests**: All passing
✅ **Credential Model**: Created and tested
✅ **Controllers Updated**: Bank and KYC controllers working
✅ **Index Warnings**: Fixed duplicate index issues
⚠️ **Blockchain Unit Tests**: Some wallet balance tests failing (pre-existing issues unrelated to Credential model)

## Migration Notes

### For Existing Data:

If you have existing KYC requests with blockchain credentials, you may want to create a migration script to:
1. Find all KYC requests with `blockchain.issuedOnChain === true`
2. Create corresponding Credential records
3. This ensures data consistency

### Example Migration Script:

```javascript
const KycRequest = require('./models/KycRequest');
const Credential = require('./models/Credential');

async function migrateCredentials() {
  const kycRequests = await KycRequest.find({
    'blockchain.issuedOnChain': true
  }).populate('userId bankId workflow.approvedBy');

  for (const kyc of kycRequests) {
    const expiryDate = new Date(kyc.blockchain.issuedAt);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    await Credential.create({
      userId: kyc.userId._id,
      kycRequestId: kyc._id,
      bankId: kyc.bankId,
      issuedBy: kyc.workflow.approvedBy,
      credentialType: 'identity_verification',
      blockchain: {
        credentialHash: kyc.blockchain.credentialHash,
        transactionHash: kyc.blockchain.transactionHash,
        blockNumber: kyc.blockchain.blockNumber,
        holderAddress: kyc.userId.walletAddress,
        issuerAddress: process.env.BLOCKCHAIN_ISSUER_ADDRESS,
        networkId: process.env.BLOCKCHAIN_NETWORK
      },
      status: 'active',
      issuedAt: kyc.blockchain.issuedAt,
      expiresAt: expiryDate,
      credentialData: {
        fullName: kyc.userId.personalInfo?.fullName,
        dateOfBirth: kyc.userId.personalInfo?.dateOfBirth,
        nationality: kyc.userId.personalInfo?.nationality,
        kycLevel: kyc.kycLevel
      }
    });
  }
}
```

## Next Steps for Frontend

The frontend can now safely integrate with these endpoints:

1. **After KYC Approval**: Bank officer calls `POST /api/v1/bank/issue-credential`
2. **View Credentials**: Customer calls `GET /api/v1/kyc/credentials` to see all their credentials
3. **Check Status**: Frontend can display:
   - Active/Expired/Revoked status
   - Days until expiry
   - Blockchain transaction link
   - Credential details

## Environment Variables Required

Ensure these are set in `.env`:

```bash
# Blockchain
BLOCKCHAIN_NETWORK=localhost
BLOCKCHAIN_ISSUER_ADDRESS=0x... # Bank's wallet address
CONTRACT_ADDRESS=0x...
BLOCKCHAIN_PRIVATE_KEY=0x...
```

## Conclusion

The backend is now **fully ready for frontend integration** with:
- ✅ Complete Credential model
- ✅ Updated API endpoints
- ✅ Comprehensive credential lifecycle management
- ✅ Blockchain integration
- ✅ Audit trails and usage tracking
- ✅ All integration tests passing

The Credential model provides a robust foundation for managing digital identity credentials with blockchain verification.
