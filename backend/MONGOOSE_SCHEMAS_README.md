# eKYC Mongoose Schemas Documentation

## 📋 Overview

This document describes the 5 Mongoose schemas created for the eKYC blockchain system following Bangladesh Bank KYC guidelines.

**Location:** `/backend/src/models/`

---

## ✅ Created Schemas

### 1. **User Schema** (`User.js`)
**Purpose:** Manage users with three roles: customer, bank_officer, admin

#### Key Features:
- ✅ **Role-based access** (customer, bank_officer, admin)
- ✅ **Bangladesh-specific fields**:
  - NID (10, 13, or 17 digits)
  - Bangladesh divisions and districts
  - Bangladesh phone number validation
  - TIN (Tax Identification Number)
- ✅ **KYC Status tracking** (not_started, pending, under_review, approved, rejected, expired)
- ✅ **Security features**:
  - Password hashing with bcrypt
  - Login attempt tracking
  - Account locking after 5 failed attempts
  - 2FA support
- ✅ **Blockchain integration** (wallet address)
- ✅ **Consent management** (data processing, sharing, blockchain storage)

#### Virtual Fields:
- `fullName` - Gets full name from personalInfo
- `age` - Calculates age from dateOfBirth
- `isLocked` - Checks if account is locked
- `isKycExpired` - Checks if KYC has expired

#### Instance Methods:
- `comparePassword(password)` - Compare hashed password
- `createPasswordResetToken()` - Generate reset token
- `incLoginAttempts()` - Increment failed login attempts
- `resetLoginAttempts()` - Reset failed login counter

#### Usage Example:
```javascript
const { User } = require('./src/models');

// Create a new customer
const user = await User.create({
    email: 'customer@example.com',
    password: 'SecurePass@123',
    role: 'customer',
    personalInfo: {
        fullName: 'আহমেদ করিম',
        fullNameBangla: 'Ahmed Karim',
        fatherName: 'Karim Ahmed',
        motherName: 'Fatima Ahmed',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        nid: '1234567890123'
    },
    contactInfo: {
        primaryPhone: '01712345678',
        presentAddress: {
            division: 'Dhaka',
            district: 'Dhaka',
            upazila: 'Gulshan',
            postCode: '1212',
            addressLine: 'House 10, Road 5, Gulshan-1'
        },
        permanentAddress: {
            division: 'Dhaka',
            district: 'Dhaka',
            upazila: 'Gulshan',
            postCode: '1212',
            addressLine: 'House 10, Road 5, Gulshan-1'
        }
    }
});

// Login
const validPassword = await user.comparePassword('SecurePass@123');
```

---

### 2. **Bank Schema** (`Bank.js`)
**Purpose:** Manage bank information with Bangladesh regulatory compliance

#### Key Features:
- ✅ **Bangladesh Bank compliance**:
  - License number and validity tracking
  - Routing number (9 digits)
  - Bank code (4 letter code, e.g., DBBL)
  - SWIFT code validation
- ✅ **Bank types**:
  - state_owned_commercial
  - specialized
  - private_commercial
  - foreign_commercial
  - islamic_bank
  - non_banking_financial
- ✅ **Regulatory tracking**:
  - Bangladesh Bank inspection dates
  - AML/CFT compliance status
  - KYC compliance status
- ✅ **KYC statistics** (total, approved, rejected, pending)
- ✅ **Blockchain integration** (authorized issuer status)

#### Virtual Fields:
- `isLicenseValid` - Checks if bank license is valid
- `kycApprovalRate` - Calculates KYC approval percentage
- `activeOfficers` - Count of active bank officers

#### Static Methods:
- `findActive()` - Find all active and verified banks
- `findAuthorizedIssuers()` - Find blockchain-authorized banks

#### Instance Methods:
- `updateKycStats(status)` - Update KYC statistics

#### Usage Example:
```javascript
const { Bank } = require('./src/models');

// Create a bank
const bank = await Bank.create({
    bankName: 'Dutch-Bangla Bank Limited',
    bankNameBangla: 'ডাচ-বাংলা ব্যাংক লিমিটেড',
    bankCode: 'DBBL',
    swiftCode: 'DBBLBDDH',
    routingNumber: '090271626',
    licenseNumber: 'BB/2024/001',
    licenseIssueDate: new Date('2020-01-01'),
    licenseExpiryDate: new Date('2030-01-01'),
    bankType: 'private_commercial',
    headOffice: {
        addressLine: 'Sena Kalyan Bhaban, 195 Motijheel C/A',
        division: 'Dhaka',
        district: 'Dhaka',
        postCode: '1000',
        phone: '02-9566371',
        email: 'info@dutchbanglabank.com',
        website: 'https://www.dutchbanglabank.com'
    }
});

// Find active banks
const activeBanks = await Bank.findActive();
```

---

### 3. **KYC Request Schema** (`KycRequest.js`)
**Purpose:** Manage KYC request lifecycle with complete workflow tracking

#### Key Features:
- ✅ **Request types**: new, update, renewal, upgrade
- ✅ **KYC levels**: 1, 2, 3 (Bangladesh Bank requirement)
- ✅ **Complete status workflow**:
  - draft → submitted → pending → document_verification → under_review → approved/rejected
- ✅ **Status history tracking** (who changed, when, remarks)
- ✅ **Document verification tracking**
- ✅ **Risk assessment** (low, medium, high, very_high)
- ✅ **AML/CFT screening**:
  - Watchlist matching
  - PEP (Politically Exposed Person) check
  - Sanctions list check
  - Adverse media check
- ✅ **Verification checks**:
  - NID verification
  - Face matching
  - Address verification
  - Phone/Email verification
  - Biometric verification
- ✅ **Processing metrics** (time tracking)
- ✅ **Blockchain integration** (credential hash, transaction hash)

#### Virtual Fields:
- `daysSinceSubmission` - Days since KYC submitted
- `isExpired` - Check if request expired
- `allDocumentsVerified` - Check if all docs verified
- `verificationProgress` - Progress percentage

#### Static Methods:
- `findPending(bankId)` - Find pending requests
- `findOverdue()` - Find requests pending > 48 hours

#### Instance Methods:
- `assignTo(officerId)` - Assign to bank officer
- `addNote(note, userId)` - Add internal note
- `updateDocumentStatus(docId, status)` - Update document status

#### Usage Example:
```javascript
const { KycRequest } = require('./src/models');

// Create KYC request
const kycRequest = await KycRequest.create({
    userId: user._id,
    bankId: bank._id,
    requestType: 'new',
    kycLevel: 1,
    status: 'submitted',
    workflow: {
        submittedAt: new Date()
    },
    riskAssessment: {
        riskLevel: 'low',
        totalRiskScore: 25
    }
});

// Assign to officer
await kycRequest.assignTo(officerId);

// Add note
await kycRequest.addNote('Documents look good', officerId);

// Update status
kycRequest.status = 'approved';
await kycRequest.save();
```

---

### 4. **Document Schema** (`Document.js`)
**Purpose:** Manage documents with encryption metadata and access control

#### Key Features:
- ✅ **Document types**:
  - Identity: nid_front, nid_back, passport, birth_certificate
  - Address: utility_bill, bank_statement
  - Financial: tax_certificate, income_proof
  - Biometric: photograph, signature
- ✅ **Encryption metadata**:
  - Algorithm (aes-256-cbc, aes-256-gcm)
  - IV (initialization vector)
  - Encryption key ID
  - Encrypted timestamp
- ✅ **File integrity**:
  - Hash value (SHA256/SHA512)
  - File size validation (max 10MB)
  - Allowed types: JPEG, PNG, PDF
- ✅ **Blockchain storage** (document hash, transaction hash)
- ✅ **OCR/Extracted data** (NID number, name, DOB, etc.)
- ✅ **Quality checks**:
  - Image quality scoring
  - Tamper detection
  - Face detection
  - Readability check
- ✅ **Access control** (role-based, user-based)
- ✅ **Access logging** (who accessed, when, why)
- ✅ **Retention policy** (5 years minimum - Bangladesh Bank)
- ✅ **Version control** (track document replacements)

#### Virtual Fields:
- `fileSizeMB` - File size in megabytes
- `daysUntilExpiry` - Days until document expires
- `isAccessible` - Check if document is accessible

#### Static Methods:
- `generateHash(buffer)` - Generate file hash
- `findExpired()` - Find expired documents
- `findPendingVerification(userId)` - Find docs pending verification

#### Instance Methods:
- `logAccess(userId, action)` - Log document access
- `softDelete(userId, reason)` - Soft delete document
- `canAccess(userId, userRole)` - Check access permission

#### Usage Example:
```javascript
const { Document } = require('./src/models');

// Upload document
const document = await Document.create({
    userId: user._id,
    kycRequestId: kycRequest._id,
    documentType: 'nid_front',
    documentCategory: 'identity',
    file: {
        originalName: 'nid.jpg',
        fileName: 'nid_1234567890.jpg',
        filePath: '/uploads/documents/nid_1234567890.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1048576,
        fileExtension: 'jpg'
    },
    encryption: {
        isEncrypted: true,
        algorithm: 'aes-256-cbc',
        iv: Buffer.from('random-iv').toString('hex'),
        encryptionKeyId: 'key_2024_001'
    },
    hash: {
        algorithm: 'sha256',
        value: Document.generateHash(fileBuffer)
    }
});

// Log access
await document.logAccess(officerId, 'view', req.ip, 'KYC verification');

// Check if user can access
if (document.canAccess(userId, userRole)) {
    // Show document
}
```

---

### 5. **Audit Log Schema** (`AuditLog.js`)
**Purpose:** Immutable compliance logging for regulatory requirements

#### Key Features:
- ✅ **Immutable logs** (cannot be modified after creation)
- ✅ **Comprehensive action tracking** (50+ action types)
- ✅ **Action categories**:
  - authentication, authorization, kyc, document, credential
  - consent, bank, admin, security, blockchain, compliance
- ✅ **Severity levels**: info, low, medium, high, critical
- ✅ **Actor tracking** (who did what)
- ✅ **Target tracking** (what was affected)
- ✅ **Request details** (IP, user agent, device type, location)
- ✅ **Compliance requirements**:
  - Bangladesh Bank KYC
  - AML/CFT Act 2012
  - Money Laundering Prevention Act 2012
  - Data protection
  - Audit trail
- ✅ **5-year retention** (Bangladesh Bank requirement)
- ✅ **Auto-flagging** for suspicious activities
- ✅ **Blockchain verification** (for critical actions)
- ✅ **PII anonymization support**

#### Virtual Fields:
- `ageInDays` - Age of log in days
- `daysUntilDeletion` - Days until auto-deletion
- `isCritical` - Check if critical severity

#### Static Methods:
- `createLog(logData)` - Create new audit log
- `findByUser(userId, startDate, endDate)` - Find logs by user
- `findByAction(actionType)` - Find logs by action
- `findSuspicious(limit)` - Find suspicious activities
- `generateComplianceReport(startDate, endDate)` - Generate report
- `findFailedLogins(userId, hours)` - Find failed login attempts

#### Instance Methods:
- `anonymize()` - Anonymize PII data

#### Usage Example:
```javascript
const { AuditLog } = require('./src/models');

// Create audit log
await AuditLog.createLog({
    actor: {
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        bankId: officer.bankOfficerInfo.bankId
    },
    action: {
        type: 'kyc_approve',
        category: 'kyc',
        description: `KYC request ${kycRequest.requestId} approved`,
        severity: 'medium'
    },
    target: {
        resourceType: 'kyc_request',
        resourceId: kycRequest._id,
        resourceIdentifier: kycRequest.requestId
    },
    status: 'success',
    request: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        deviceType: 'web',
        method: req.method,
        endpoint: req.originalUrl
    },
    compliance: {
        regulatoryRequirement: 'bangladesh_bank_kyc'
    }
});

// Find suspicious activities
const suspicious = await AuditLog.findSuspicious(50);

// Generate compliance report
const report = await AuditLog.generateComplianceReport(
    new Date('2024-01-01'),
    new Date('2024-12-31'),
    { category: 'kyc' }
);

// Find failed logins for a user
const failedLogins = await AuditLog.findFailedLogins(userId, 24);
```

---

## 📦 Index File (`index.js`)

All models are exported from a single file for easy importing:

```javascript
// Import all models
const { User, Bank, KycRequest, Document, AuditLog } = require('./src/models');

// Or import individually
const User = require('./src/models/User');
```

---

## 🗂️ File Structure

```
backend/src/models/
├── User.js          (10 KB) - User management with roles
├── Bank.js          (8.6 KB) - Bank information & compliance
├── KycRequest.js    (15 KB) - KYC workflow management
├── Document.js      (13 KB) - Document storage & encryption
├── AuditLog.js      (16 KB) - Immutable compliance logging
└── index.js         (274 B) - Export all models
```

---

## 🔐 Security Features

### Password Security
- ✅ Bcrypt hashing (cost factor: 12)
- ✅ Password changed timestamp tracking
- ✅ Password reset token generation

### Account Security
- ✅ Login attempt tracking
- ✅ Account locking (5 failed attempts = 2 hour lock)
- ✅ 2FA support

### Document Security
- ✅ AES-256 encryption
- ✅ SHA-256/SHA-512 hashing
- ✅ Access control (role-based, user-based)
- ✅ Access logging

### Audit Security
- ✅ Immutable logs (cannot be modified)
- ✅ 5-year retention
- ✅ Blockchain verification for critical actions

---

## 📊 Performance Optimizations

### Indexes Created
- ✅ Compound indexes for common queries
- ✅ Sparse indexes for optional unique fields
- ✅ TTL indexes for auto-expiry
- ✅ Text indexes for search (if needed)

### Query Optimization
- ✅ Pre-save hooks for data processing
- ✅ Virtual fields for computed values
- ✅ Lean queries for read-only operations
- ✅ Population for relationships

---

## 🇧🇩 Bangladesh-Specific Features

### User Schema
- ✅ NID validation (10, 13, or 17 digits)
- ✅ Bangladesh phone validation (`01XXXXXXXXX`)
- ✅ 8 divisions (Dhaka, Chattogram, etc.)
- ✅ 4-digit post codes
- ✅ TIN (12 digits)

### Bank Schema
- ✅ Bangladesh Bank license tracking
- ✅ 9-digit routing number
- ✅ AML/CFT compliance
- ✅ 6 bank types

### KYC Schema
- ✅ 3 KYC levels (Bangladesh Bank)
- ✅ PEP checking
- ✅ Sanctions list screening

### Compliance
- ✅ Bangladesh Bank KYC guidelines
- ✅ AML/CFT Act 2012
- ✅ Money Laundering Prevention Act 2012

---

## 🧪 Testing

Run the schema tests:

```bash
node test-schemas.js
```

**Test Results:**
```
✅ User schema validation passed
✅ Bank schema validation passed
✅ KYC Request schema validation passed
✅ Document schema validation passed
✅ Audit Log schema validation passed
✅ Virtual fields working correctly
✅ Static methods exist
✅ Instance methods exist
```

---

## 🚀 Next Steps

1. **Create Controllers** (`/src/controllers/`)
   - userController.js
   - bankController.js
   - kycController.js
   - documentController.js

2. **Create Routes** (`/src/routes/`)
   - authRoutes.js
   - kycRoutes.js
   - documentRoutes.js
   - adminRoutes.js

3. **Create Services** (`/src/services/`)
   - userService.js
   - kycService.js
   - documentService.js
   - blockchainService.js

4. **Create Middleware** (`/src/middleware/`)
   - auth.js (JWT verification)
   - roleCheck.js (role-based access)
   - auditLogger.js (auto-logging)

---

## 📚 Additional Resources

- **MongoDB Connection**: `mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_db`
- **MongoDB Express GUI**: http://localhost:8081
- **Mongoose Documentation**: https://mongoosejs.com/docs/
- **Bangladesh Bank Guidelines**: https://www.bb.org.bd/

---

## 🛠️ Maintenance

### Index Warnings
The test shows some duplicate index warnings. These are harmless but can be cleaned up by removing `index: true` from fields that already have compound indexes defined.

### Schema Updates
When updating schemas:
1. Create a migration script
2. Test on staging first
3. Update indexes if needed
4. Document changes

---

## 📞 Support

For questions about the schemas:
1. Check this documentation
2. Review the schema files
3. Check Mongoose documentation
4. Review Bangladesh Bank guidelines

---

**Created:** October 31, 2025
**Last Updated:** October 31, 2025
**Version:** 1.0.0
