# eKYC Blockchain System - API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Authentication APIs](#authentication-apis)
  - [KYC APIs](#kyc-apis)
  - [Bank APIs](#bank-apis)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Testing](#testing)

## Overview

The eKYC Blockchain System provides RESTful APIs for managing digital identity verification with blockchain-based credential issuance. The system supports three user roles:
- **Customer**: Submit KYC requests and retrieve credentials
- **Bank Officer**: Verify KYC requests and issue blockchain credentials
- **Admin**: System administration (not yet implemented)

## Base URL

```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

Most endpoints require authentication using JSON Web Tokens (JWT).

### Request Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Token Lifecycle
- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- Use the `/auth/refresh` endpoint to obtain new access tokens

---

## API Endpoints

### Authentication APIs

#### 1. Register Customer
Register a new customer account.

**Endpoint:** `POST /auth/register/customer`

**Access:** Public

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePass@123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Customer registered successfully",
  "data": {
    "user": {
      "_id": "64f8a3b2c1234567890abcde",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "isActive": true,
      "createdAt": "2024-11-22T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 2. Register Bank Officer
Register a new bank officer account.

**Endpoint:** `POST /auth/register/bank-officer`

**Access:** Public (should be restricted in production)

**Request Body:**
```json
{
  "email": "officer@bank.com",
  "password": "SecurePass@123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567891",
  "bankName": "Central Bank",
  "officerIdNumber": "OFF123456",
  "branch": "Main Branch"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Bank officer registered successfully",
  "data": {
    "user": {
      "_id": "64f8a3b2c1234567890abcdf",
      "email": "officer@bank.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "bank_officer",
      "bankName": "Central Bank",
      "officerIdNumber": "OFF123456",
      "isActive": true,
      "createdAt": "2024-11-22T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 3. Login
Authenticate and obtain access tokens.

**Endpoint:** `POST /auth/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "SecurePass@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64f8a3b2c1234567890abcde",
      "email": "customer@example.com",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 4. Refresh Token
Obtain a new access token using refresh token.

**Endpoint:** `POST /auth/refresh`

**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 5. Get Current User
Get details of currently authenticated user.

**Endpoint:** `GET /auth/me`

**Access:** Private (Authenticated users)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a3b2c1234567890abcde",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer",
    "isActive": true
  }
}
```

---

#### 6. Logout
Invalidate current refresh token.

**Endpoint:** `POST /auth/logout`

**Access:** Private (Authenticated users)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### KYC APIs

#### 1. Submit KYC Request
Submit a new KYC verification request with documents.

**Endpoint:** `POST /kyc/submit`

**Access:** Private (Customer only)

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "documentType": "passport",
  "documentNumber": "P123456789",
  "fullName": "John Doe",
  "dateOfBirth": "1990-01-15",
  "nationality": "US",
  "address": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "documentFrontImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "documentBackImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "selfieImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Valid Document Types:**
- `passport`
- `national_id`
- `drivers_license`

**Response (201 Created):**
```json
{
  "success": true,
  "message": "KYC request submitted successfully",
  "data": {
    "_id": "64f8a3b2c1234567890abce0",
    "userId": "64f8a3b2c1234567890abcde",
    "status": "pending",
    "documentType": "passport",
    "documentNumber": "P123456789",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-15",
    "nationality": "US",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "createdAt": "2024-11-22T10:00:00.000Z",
    "updatedAt": "2024-11-22T10:00:00.000Z"
  }
}
```

---

#### 2. Get KYC Status
Get status of a specific KYC request.

**Endpoint:** `GET /kyc/status/:requestId`

**Access:** Private (Request owner)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a3b2c1234567890abce0",
    "status": "approved",
    "documentType": "passport",
    "documentNumber": "P123456789",
    "fullName": "John Doe",
    "submittedAt": "2024-11-22T10:00:00.000Z",
    "verifiedAt": "2024-11-22T11:00:00.000Z",
    "verificationNotes": "All documents verified successfully",
    "credentialId": "64f8a3b2c1234567890abce1"
  }
}
```

**Possible Statuses:**
- `pending`: Awaiting verification
- `under_review`: Being reviewed by bank officer
- `approved`: Verified and approved
- `rejected`: Verification failed
- `expired`: Request expired

---

#### 3. Get KYC History
Get paginated history of user's KYC requests.

**Endpoint:** `GET /kyc/history`

**Access:** Private (Customer only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status

**Example:**
```
GET /kyc/history?page=1&limit=10&status=approved
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "_id": "64f8a3b2c1234567890abce0",
        "status": "approved",
        "documentType": "passport",
        "createdAt": "2024-11-22T10:00:00.000Z",
        "verifiedAt": "2024-11-22T11:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

---

#### 4. Get Credentials
Get user's blockchain credentials.

**Endpoint:** `GET /kyc/credentials`

**Access:** Private (Customer only)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a3b2c1234567890abce1",
      "credentialId": "CRED-1700654400000-ABC123",
      "userId": "64f8a3b2c1234567890abcde",
      "kycRequestId": "64f8a3b2c1234567890abce0",
      "credentialType": "identity_verification",
      "status": "active",
      "transactionHash": "0x1234567890abcdef...",
      "blockNumber": 12345,
      "issuedAt": "2024-11-22T11:00:00.000Z",
      "expiresAt": "2025-11-22T11:00:00.000Z"
    }
  ]
}
```

---

### Bank APIs

All bank APIs require `bank_officer` role.

#### 1. Get KYC Requests
Get list of KYC requests for bank officer's bank.

**Endpoint:** `GET /bank/kyc-requests`

**Access:** Private (Bank Officer only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (pending, approved, rejected)
- `search` (optional): Search by name or document number

**Example:**
```
GET /bank/kyc-requests?status=pending&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "_id": "64f8a3b2c1234567890abce0",
        "userId": {
          "_id": "64f8a3b2c1234567890abcde",
          "email": "customer@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "status": "pending",
        "documentType": "passport",
        "documentNumber": "P123456789",
        "fullName": "John Doe",
        "createdAt": "2024-11-22T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "total": 100,
      "limit": 20
    }
  }
}
```

---

#### 2. Get KYC Request Details
Get detailed information about a specific KYC request including document images.

**Endpoint:** `GET /bank/kyc-request/:id`

**Access:** Private (Bank Officer only)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "64f8a3b2c1234567890abce0",
    "userId": {
      "_id": "64f8a3b2c1234567890abcde",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "status": "pending",
    "documentType": "passport",
    "documentNumber": "P123456789",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-15",
    "nationality": "US",
    "address": {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "documentFrontImage": "/uploads/documents/front_xxx.jpg",
    "documentBackImage": "/uploads/documents/back_xxx.jpg",
    "selfieImage": "/uploads/documents/selfie_xxx.jpg",
    "createdAt": "2024-11-22T10:00:00.000Z"
  }
}
```

---

#### 3. Verify KYC Request
Approve or reject a KYC request.

**Endpoint:** `POST /bank/verify/:requestId`

**Access:** Private (Bank Officer only)

**Request Body:**
```json
{
  "action": "approve",
  "verificationNotes": "All documents verified. Identity confirmed."
}
```

**Valid Actions:**
- `approve`: Approve the KYC request
- `reject`: Reject the KYC request

**Response (200 OK):**
```json
{
  "success": true,
  "message": "KYC request approved successfully",
  "data": {
    "_id": "64f8a3b2c1234567890abce0",
    "status": "approved",
    "verifiedBy": "64f8a3b2c1234567890abcdf",
    "verifiedAt": "2024-11-22T11:00:00.000Z",
    "verificationNotes": "All documents verified. Identity confirmed."
  }
}
```

---

#### 4. Issue Blockchain Credential
Issue a blockchain credential for an approved KYC request.

**Endpoint:** `POST /bank/issue-credential`

**Access:** Private (Bank Officer only)

**Request Body:**
```json
{
  "kycRequestId": "64f8a3b2c1234567890abce0",
  "credentialType": "identity_verification",
  "expiryDate": "2025-11-22T11:00:00.000Z"
}
```

**Valid Credential Types:**
- `identity_verification`
- `address_verification`
- `document_verification`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Credential issued successfully on blockchain",
  "data": {
    "credential": {
      "_id": "64f8a3b2c1234567890abce1",
      "credentialId": "CRED-1700654400000-ABC123",
      "userId": "64f8a3b2c1234567890abcde",
      "kycRequestId": "64f8a3b2c1234567890abce0",
      "credentialType": "identity_verification",
      "status": "active",
      "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "blockNumber": 12345,
      "issuedBy": "64f8a3b2c1234567890abcdf",
      "issuedAt": "2024-11-22T11:00:00.000Z",
      "expiresAt": "2025-11-22T11:00:00.000Z"
    },
    "transaction": {
      "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "blockNumber": 12345,
      "gasUsed": "250000"
    }
  }
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message here"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Error Examples

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Email is required, Password must be at least 8 characters"
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**Authorization Error (403):**
```json
{
  "success": false,
  "message": "Access denied. Bank officer role required."
}
```

**Rate Limit Error (429):**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

### General Limits
- **General API**: 100 requests per 15 minutes per IP

### Authentication Routes
- **Registration/Refresh**: 10 requests per minute per IP
- **Login**: 5 requests per 5 minutes per IP (successful logins not counted)

### KYC Routes
- **KYC Submission**: 5 requests per hour per user
- **General KYC Routes**: 100 requests per 15 minutes per IP

### Bank Routes
- **Credential Issuance**: 10 requests per hour per officer
- **General Bank Routes**: 200 requests per 15 minutes per IP

Rate limit headers are included in responses:
```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1700654400
```

---

## Testing

### Running Integration Tests

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

### Running Demo Flow

The demo script demonstrates the complete KYC workflow:

```bash
# Make sure the server is running first
npm run dev

# In another terminal, run the demo
node scripts/demo-flow.js
```

The demo will:
1. Register a customer
2. Submit a KYC request
3. Register a bank officer
4. Bank officer logs in
5. Retrieve KYC requests
6. Approve the KYC request
7. Issue blockchain credential
8. Customer retrieves credential
9. Check final KYC status

---

## Example Usage with cURL

### Register and Login
```bash
# Register customer
curl -X POST http://localhost:5000/api/v1/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "SecurePass@123",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "SecurePass@123"
  }'
```

### Submit KYC (with token)
```bash
curl -X POST http://localhost:5000/api/v1/kyc/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "documentType": "passport",
    "documentNumber": "P123456789",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-15",
    "nationality": "US",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "documentFrontImage": "data:image/png;base64,...",
    "documentBackImage": "data:image/png;base64,...",
    "selfieImage": "data:image/png;base64,..."
  }'
```

---

## Additional Resources

- [Blockchain Service Documentation](./src/services/blockchain/README.md)
- [Model Schemas](./src/models/)
- [Environment Variables](.env.example)
- [Demo Guide](../DEMO_GUIDE.md)

---

## Support

For issues or questions, please contact the development team or create an issue in the repository.
