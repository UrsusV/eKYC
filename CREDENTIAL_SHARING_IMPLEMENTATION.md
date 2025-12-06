# Credential Sharing & Revocation Implementation Guide

## Overview
This document describes the complete implementation of the credential sharing and revocation feature for the eKYC system, allowing users to reuse verified credentials across different banks.

## Backend Implementation ✅ COMPLETED

###  1. Database Schema Updates

#### KYC Request Model (`backend/src/models/KycRequest.js`)
Added the following fields to support credential sharing:

```javascript
// Credential Sharing (for reusing existing verified credentials)
useExistingCredential: {
    type: Boolean,
    default: false
},

sharedCredentialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credential',
    index: true
},

credentialVerification: {
    verified: {
        type: Boolean,
        default: false
    },
    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    blockchainStatus: {
        isRevoked: Boolean,
        checkedAt: Date,
        blockchainData: mongoose.Schema.Types.Mixed
    },
    verificationNotes: String
}
```

### 2. API Endpoints

#### Credential Revocation Endpoints (`backend/src/routes/credential.routes.js`)

1. **POST `/api/v1/credentials/:credentialId/revoke`**
   - **Access**: Bank Officer (Issuer only)
   - **Purpose**: Revoke a credential on blockchain
   - **Request Body**:
     ```json
     {
       "reason": "fraud_detected|data_inaccuracy|user_request|expired_documents|compliance_violation|duplicate_credential|other",
       "details": "Optional explanation"
     }
     ```
   - **Response**:
     ```json
     {
       "success": true,
       "message": "Credential revoked successfully",
       "data": {
         "credentialId": "CRED-123",
         "status": "revoked",
         "revokedAt": "2025-12-06T10:00:00.000Z",
         "revocationReason": "fraud_detected",
         "transactionHash": "0x..."
       }
     }
     ```

2. **GET `/api/v1/credentials/:credentialId/revocation-status`**
   - **Access**: Bank Officer with consent
   - **Purpose**: Check credential revocation status from blockchain
   - **Response**:
     ```json
     {
       "success": true,
       "data": {
         "credentialId": "CRED-123",
         "databaseStatus": {
           "status": "active",
           "isRevoked": false
         },
         "blockchainStatus": {
           "isRevoked": false,
           "credentialHash": "0x...",
           "issuer": "0x...",
           "holder": "0x...",
           "issuedAt": 1701864000,
           "credentialType": 2
         },
         "isValid": true,
         "checkedAt": "2025-12-06T10:00:00.000Z"
       }
     }
     ```

3. **GET `/api/v1/credentials/:credentialId`**
   - **Access**: Owner or authorized officer
   - **Purpose**: Get detailed credential information

### 3. KYC Submission with Credential Sharing

#### Updated Validation Schema (`backend/src/validators/kycValidators.js`)

The `submitKycSchema` now supports two modes:
- **Traditional KYC**: User uploads documents and provides personal information
- **Credential Sharing**: User selects an existing verified credential

```javascript
{
  useExistingCredential: boolean,
  sharedCredentialId: string (required if useExistingCredential=true),
  bankId: string (optional),

  // Traditional fields (required only when useExistingCredential=false)
  nid_number: string,
  full_name: string,
  date_of_birth: date,
  address: string,
  father_name: string (optional),
  mother_name: string (optional),
  phone: string (optional)
}
```

#### KYC Submission Flow (`backend/src/controllers/kycController.js`)

When `useExistingCredential=true`:
1. Validates credential exists and belongs to the user
2. Checks credential is not revoked or expired
3. Creates KYC request with `sharedCredentialId`
4. **Automatically creates consent** for credential sharing with the new bank
5. Returns success with credential information

### 4. Automatic Consent Creation

When a user shares a credential, the system automatically creates a consent record:

```javascript
const consent = new Consent({
    userId,
    kycRequestId: result.data._id,
    consentType: 'data_sharing',
    purpose: `Sharing verified credential from ${credential.bankId} with ${bank.bankName} for KYC verification`,
    duration: 365,
    dataCategories: ['personal_info', 'identification'],
    isMandatory: true,
    canBeWithdrawn: false,
    status: 'granted',
    grantedAt: new Date()
});
```

### 5. Automatic Blockchain Verification

#### Bank Officer View (`backend/src/controllers/bankController.js`)

When a bank officer views a KYC request that uses a shared credential:
1. System automatically fetches credential status from blockchain
2. Checks if credential is revoked
3. Updates KYC request with verification results
4. Displays verification status to officer

```javascript
// In getKycRequestDetails endpoint
if (kycRequest.useExistingCredential && kycRequest.sharedCredentialId) {
    const blockchainData = await credentialService.getCredential(
        credential.blockchain.blockchainCredentialId
    );

    kycRequest.credentialVerification = {
        verified: !blockchainData.isRevoked,
        verifiedAt: new Date(),
        verifiedBy: bankOfficer._id,
        blockchainStatus: {
            isRevoked: blockchainData.isRevoked,
            checkedAt: new Date(),
            blockchainData: blockchainData
        }
    };

    await kycRequest.save();
}
```

### 6. Smart Contract Integration

The existing `CredentialRegistry.sol` already supports:
- `revokeCredential(bytes32 _credentialId)` - Revoke a credential
- `getCredential(bytes32 _credentialId)` - Get credential details including revocation status
- `CredentialRevoked` event emission

The blockchain service (`backend/src/services/blockchain/CredentialService.js`) provides:
- `revokeCredential(credentialId, options)` - Revoke on blockchain
- `getCredential(credentialId)` - Get credential with revocation status

## Frontend Implementation

### 1. Type Updates (`frontend/src/types/index.ts`)

```typescript
export interface SubmitKycRequest {
  // Credential sharing options
  useExistingCredential?: boolean;
  sharedCredentialId?: string;
  bankId?: string;

  // Traditional KYC fields (required only when NOT using existing credential)
  nid_number?: string;
  full_name?: string;
  date_of_birth?: string;
  address?: string;
  father_name?: string;
  mother_name?: string;
  phone?: string;
}
```

### 2. Frontend Updates Required

#### A. KYC Submission Page (`frontend/src/pages/SubmitKycPage.tsx`)

**Add to initial state:**
```typescript
const [useExistingCredential, setUseExistingCredential] = useState(false);
const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
const [credentials, setCredentials] = useState<Credential[]>([]);
const [selectedBank, setSelectedBank] = useState<string>("");
```

**Add credential loading:**
```typescript
useEffect(() => {
  const loadCredentials = async () => {
    try {
      const result = await kycService.getCredentials({ status: 'active' });
      setCredentials(result.data || []);
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  };
  loadCredentials();
}, []);
```

**Add Step 0 (before current Step 1) - Credential Selection:**
```tsx
{currentStep === 0 && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Choose Verification Method</h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Option 1: Use Existing Credential */}
      <button
        onClick={() => setUseExistingCredential(true)}
        className={`p-6 border-2 rounded-lg ${
          useExistingCredential ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <h4 className="font-semibold mb-2">Use Existing Credential</h4>
        <p className="text-sm text-gray-600">
          Reuse your verified credential from another bank
        </p>
      </button>

      {/* Option 2: Upload New Documents */}
      <button
        onClick={() => setUseExistingCredential(false)}
        className={`p-6 border-2 rounded-lg ${
          !useExistingCredential ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <h4 className="font-semibold mb-2">Upload New Documents</h4>
        <p className="text-sm text-gray-600">
          Submit new KYC documents for verification
        </p>
      </button>
    </div>

    {/* Show credential selection if using existing */}
    {useExistingCredential && (
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Select Your Credential
        </label>
        <select
          value={selectedCredential?._id || ''}
          onChange={(e) => {
            const cred = credentials.find(c => c._id === e.target.value);
            setSelectedCredential(cred || null);
          }}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Select a credential --</option>
          {credentials.map(cred => (
            <option key={cred._id} value={cred._id}>
              {cred.bank?.name} - Issued on {new Date(cred.issuedAt).toLocaleDateString()}
              {cred.isExpired && ' (Expired)'}
            </option>
          ))}
        </select>

        {selectedCredential && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-semibold mb-2">Credential Details:</h5>
            <p><strong>ID:</strong> {selectedCredential.credentialId}</p>
            <p><strong>Issuing Bank:</strong> {selectedCredential.bank?.name}</p>
            <p><strong>Issued:</strong> {new Date(selectedCredential.issuedAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span className={selectedCredential.isValid ? 'text-green-600' : 'text-red-600'}>
              {selectedCredential.isValid ? '✓ Valid' : '✗ Invalid'}
            </span></p>
          </div>
        )}
      </div>
    )}

    <button
      onClick={() => {
        if (useExistingCredential && !selectedCredential) {
          setErrors({ submit: 'Please select a credential' });
          return;
        }
        setCurrentStep(useExistingCredential ? 4 : 1);
      }}
      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
    >
      Continue
    </button>
  </div>
)}
```

**Update submit function:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    setLoading(true);

    let submissionData: SubmitKycRequest;

    if (useExistingCredential && selectedCredential) {
      // Credential sharing submission
      submissionData = {
        useExistingCredential: true,
        sharedCredentialId: selectedCredential._id,
        bankId: selectedBank || undefined
      };
    } else {
      // Traditional KYC submission
      const addressString = formData.address
        ? `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipCode}, ${formData.address.country}`
        : '';

      submissionData = {
        useExistingCredential: false,
        nid_number: formData.documentNumber?.trim() || '',
        full_name: formData.fullName?.trim() || '',
        date_of_birth: formData.dateOfBirth || '',
        address: addressString.trim(),
      };
    }

    const result = await kycService.submitKyc(submissionData);
    console.log("KYC submitted successfully:", result);
    navigate("/kyc/status");
  } catch (error: any) {
    console.error("Failed to submit KYC:", error);
    setErrors({
      submit: error.response?.data?.message || error.message || "Failed to submit KYC request"
    });
  } finally {
    setLoading(false);
  }
};
```

#### B. KYC Request Details Page for Officers (`frontend/src/pages/ReviewKycPage.tsx`)

**Add credential verification display:**
```tsx
{kycRequest.useExistingCredential && kycRequest.sharedCredentialId && (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <h3 className="text-lg font-semibold mb-4">Shared Credential Details</h3>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-gray-600">Issuing Institution</p>
        <p className="font-medium">{kycRequest.sharedCredentialId.bank?.name}</p>
      </div>

      <div>
        <p className="text-sm text-gray-600">Issuance Date</p>
        <p className="font-medium">
          {new Date(kycRequest.sharedCredentialId.issuedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="col-span-2">
        <p className="text-sm text-gray-600">Blockchain Status</p>
        {kycRequest.credentialVerificationResult ? (
          <div className={`mt-2 p-4 rounded-lg ${
            kycRequest.credentialVerificationResult.isValid
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <p className={`text-lg font-semibold ${
              kycRequest.credentialVerificationResult.isValid
                ? 'text-green-700'
                : 'text-red-700'
            }`}>
              {kycRequest.credentialVerificationResult.isValid
                ? '✅ Verified - Not Revoked'
                : '❌ Revoked'}
            </p>
            <p className="text-sm mt-2">
              Checked at: {new Date(kycRequest.credentialVerificationResult.checkedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Verifying on blockchain...</p>
        )}
      </div>
    </div>

    <button
      onClick={() => navigate(`/credentials/${kycRequest.sharedCredentialId._id}`)}
      className="mt-4 text-blue-600 hover:underline text-sm"
    >
      View Full Credential Details →
    </button>
  </div>
)}
```

## Testing the Flow

### Test Scenario: Ash Kara (user) with DBBL credential opening BRAC account

1. **Setup**: Ensure user "ash kara" has an active credential from DBBL
   ```bash
   # Check credentials
   curl -X GET http://localhost:5000/api/v1/kyc/credentials \
     -H "Authorization: Bearer <ash_kara_token>"
   ```

2. **Submit KYC with Credential Sharing** (as Ash Kara):
   ```bash
   curl -X POST http://localhost:5000/api/v1/kyc/submit \
     -H "Authorization: Bearer <ash_kara_token>" \
     -H "Content-Type: application/json" \
     -d '{
       "useExistingCredential": true,
       "sharedCredentialId": "<credential_id_from_DBBL>",
       "bankId": "<BRAC_bank_id>"
     }'
   ```

3. **View KYC Request** (as BRAC officer):
   - Navigate to KYC queue
   - Click on Ash Kara's request
   - System automatically verifies credential from blockchain
   - Officer sees:
     - Credential details from DBBL
     - Blockchain verification status
     - Whether credential is revoked or not

4. **Approve/Reject Based on Verification**:
   - If credential is valid (not revoked): Officer can approve
   - If credential is revoked: Officer should reject

## Key Features

✅ **Credential Revocation**
- Bank officers can revoke credentials they issued
- Revocation is recorded on blockchain
- Immutable audit trail

✅ **Credential Sharing**
- Users can reuse verified credentials across banks
- Automatic consent creation
- No need to re-submit documents

✅ **Automatic Verification**
- Officers see real-time blockchain verification
- Automatic check when viewing KYC request
- Clear indication of revocation status

✅ **Security & Privacy**
- Only issuing bank can revoke
- Consent required for sharing
- Blockchain ensures tamper-proof records

## API Reference Summary

| Endpoint | Method | Access | Purpose |
|----------|--------|--------|---------|
| `/api/v1/credentials/:id/revoke` | POST | Bank Officer (Issuer) | Revoke credential |
| `/api/v1/credentials/:id/revocation-status` | GET | Bank Officer (with consent) | Check revocation status |
| `/api/v1/credentials/:id` | GET | Owner/Officer | Get credential details |
| `/api/v1/kyc/submit` | POST | Customer | Submit KYC (traditional or with credential) |
| `/api/v1/bank/kyc-request/:id` | GET | Bank Officer | View KYC request (auto-verifies credential) |

## Files Modified

### Backend
- `backend/src/models/KycRequest.js` - Added credential sharing fields
- `backend/src/models/Credential.js` - Already had revocation support
- `backend/src/controllers/credentialController.js` - NEW: Credential revocation endpoints
- `backend/src/controllers/kycController.js` - Updated: Credential sharing in submission
- `backend/src/controllers/bankController.js` - Updated: Auto-verification in request details
- `backend/src/services/kycService.js` - Updated: Support credential sharing
- `backend/src/validators/kycValidators.js` - Updated: Optional fields for credential sharing
- `backend/src/routes/credential.routes.js` - NEW: Credential routes
- `backend/src/app.js` - Wired up credential routes

### Frontend (To Be Updated)
- `frontend/src/types/index.ts` - ✅ Updated: SubmitKycRequest interface
- `frontend/src/pages/SubmitKycPage.tsx` - TODO: Add credential selection
- `frontend/src/pages/ReviewKycPage.tsx` - TODO: Add credential verification display

## Blockchain Smart Contract

The `CredentialRegistry.sol` contract already supports:
```solidity
function revokeCredential(bytes32 _credentialId) public
function getCredential(bytes32 _credentialId) public view returns (...)
event CredentialRevoked(bytes32 indexed credentialId)
```

No changes needed to the smart contract.
