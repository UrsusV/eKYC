# eKYC Frontend Integration Guide

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
- [Backend Setup Commands](#backend-setup-commands)
- [System Architecture](#system-architecture)
- [User Roles & Workflows](#user-roles--workflows)
- [API Endpoints Reference](#api-endpoints-reference)
- [Required Frontend Pages/Views](#required-frontend-pages-views)
- [API Integration Examples](#api-integration-examples)
- [Authentication Flow](#authentication-flow)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Overview

This eKYC (Know Your Customer) system is a blockchain-based digital identity verification platform with three user roles:
- **Customers**: Submit KYC requests and receive blockchain credentials
- **Bank Officers**: Verify KYC requests and issue blockchain credentials
- **Admin**: System administration (coming soon)

### Tech Stack
- **Backend**: Node.js, Express.js, MongoDB, Redis, Ethereum/Hardhat
- **Authentication**: JWT (Access + Refresh tokens)
- **Blockchain**: Ethereum smart contracts for credential issuance
- **Documentation**: Full API docs available at `backend/API_DOCUMENTATION.md`

---

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose (for MongoDB & Redis)

### Environment Setup

The backend requires these services to run:
1. MongoDB (database)
2. Redis (caching & sessions)
3. Hardhat node (local blockchain - optional for development)
4. Backend server (Express.js)

---

## Backend Setup Commands

### Terminal 1: Start Docker Services (MongoDB & Redis)

```bash
# Navigate to project root
cd /home/ursus/projects/eKYC/eKYC

# Start MongoDB and Redis using Docker Compose
docker-compose up -d

# Verify services are running
docker ps

# You should see:
# - mongo:latest (port 27017)
# - redis:latest (port 6379)
# - mongo-express (port 8081)
# - redis-commander (port 8082)
```

**Management Tools:**
- MongoDB Express: http://localhost:8081
- Redis Commander: http://localhost:8082

### Terminal 2: Start Hardhat Blockchain Node (Optional)

**Note:** Only needed if you want to test blockchain credential issuance. You can skip this for frontend UI development.

```bash
# Navigate to blockchain directory
cd /home/ursus/projects/eKYC/eKYC/blockchain

# Install dependencies (first time only)
npm install

# Start Hardhat local node
npm run node

# Keep this terminal running
# You should see: "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"
```

### Terminal 3: Deploy Smart Contracts (Optional)

**Note:** Only needed if you started the Hardhat node in Terminal 2.

```bash
# Open a new terminal
cd /home/ursus/projects/eKYC/eKYC/blockchain

# Deploy contracts to local network
npm run deploy:local

# Copy the CONTRACT_ADDRESS from output and update backend/.env
# Example output: "CredentialRegistry deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3"
```

### Terminal 4: Start Backend Server

```bash
# Navigate to backend directory
cd /home/ursus/projects/eKYC/eKYC/backend

# Install dependencies (first time only)
npm install

# Copy environment file (first time only)
cp .env.example .env

# Edit .env and ensure these are set:
# - MONGODB_URI=mongodb://admin:eKYC_Admin_2025@localhost:27017/ekyc_db?authSource=admin
# - REDIS_URL=redis://:eKYC_Redis_2025@localhost:6379
# - CONTRACT_ADDRESS=<from Terminal 3 if using blockchain>

# Start backend in development mode
npm run dev

# Backend should start at: http://localhost:5000
# API Base URL: http://localhost:5000/api/v1
```

### Verify Backend is Running

```bash
# In a new terminal, test the health endpoint
curl http://localhost:5000/health

# Expected response:
# {"status":"healthy","timestamp":"2024-11-29T...","uptime":123}
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                     │
│                  (React/Vue/Angular/Next.js)                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ HTTP/REST API
                          │ (JWT Authentication)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend API (Express.js)                    │
│                  http://localhost:5000/api/v1               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Routes  │  │  KYC Routes  │  │ Bank Routes  │     │
│  │ /auth/*      │  │  /kyc/*      │  │ /bank/*      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐                                          │
│  │Consent Routes│                                          │
│  │ /consent/*   │                                          │
│  └──────────────┘                                          │
└───────────┬────────────────────────────┬────────────────────┘
            │                            │
            ▼                            ▼
┌─────────────────────┐      ┌─────────────────────────┐
│   MongoDB + Redis   │      │  Blockchain (Hardhat)   │
│   (Docker)          │      │  Smart Contracts        │
│   - User Data       │      │  - Credential Registry  │
│   - KYC Requests    │      │  - Immutable Records    │
│   - Credentials     │      │                         │
└─────────────────────┘      └─────────────────────────┘
```

---

## User Roles & Workflows

### 1. Customer Journey

```
Register → Login → Submit KYC → Wait for Approval → View Credentials
```

**Steps:**
1. Register account with email/password
2. Login and receive JWT tokens
3. Submit KYC request with documents (ID, selfie, etc.)
4. Grant required consents (GDPR compliant)
5. Wait for bank officer to verify
6. Receive notification when approved
7. View blockchain credential in dashboard

### 2. Bank Officer Journey

```
Register → Login → View KYC Queue → Review Request → Approve/Reject → Issue Credential
```

**Steps:**
1. Register as bank officer (associated with a bank)
2. Login and receive JWT tokens
3. View pending KYC requests for their bank
4. Review request details and documents
5. Approve or reject with notes
6. Issue blockchain credential (on approval)
7. View issued credentials

### 3. Admin Journey (Coming Soon)

System administration and monitoring.

---

## API Endpoints Reference

### Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

### Authentication Header
All authenticated requests require:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Quick Reference

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| **Authentication** |
| POST | `/auth/register/customer` | Public | Register customer |
| POST | `/auth/register/bank-officer` | Public | Register bank officer |
| POST | `/auth/login` | Public | Login user |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | Private | Get current user |
| POST | `/auth/logout` | Private | Logout user |
| **Customer KYC** |
| POST | `/kyc/submit` | Customer | Submit KYC request |
| GET | `/kyc/status/:requestId` | Customer | Get KYC status |
| GET | `/kyc/history` | Customer | Get KYC history |
| GET | `/kyc/credentials` | Customer | Get credentials |
| **Bank Officer** |
| GET | `/bank/kyc-requests` | Bank Officer | Get KYC requests |
| GET | `/bank/kyc-request/:id` | Bank Officer | Get request details |
| POST | `/bank/verify/:requestId` | Bank Officer | Approve/Reject KYC |
| POST | `/bank/issue-credential` | Bank Officer | Issue blockchain credential |
| **Consent Management** |
| POST | `/consent/create` | Customer | Create consent request |
| POST | `/consent/:consentId/grant` | Customer | Grant consent |
| POST | `/consent/:consentId/deny` | Customer | Deny consent |
| POST | `/consent/:consentId/revoke` | Customer | Revoke consent |
| GET | `/consent/my-consents` | Customer | Get my consents |
| GET | `/consent/:consentId` | Customer | Get consent details |
| POST | `/consent/bulk-grant` | Customer | Grant multiple consents |

### Token Lifecycle
- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- Use `/auth/refresh` to get new access token

---

## Required Frontend Pages/Views

### 1. Public Pages (No Authentication)

#### 1.1 Landing Page
- **Route**: `/`
- **Purpose**: Marketing page with system overview
- **Components**:
  - Hero section explaining eKYC
  - Features showcase
  - Call-to-action buttons (Sign Up, Login)
  - Testimonials
  - Footer with links

#### 1.2 Customer Registration
- **Route**: `/register/customer`
- **API**: `POST /auth/register/customer`
- **Form Fields**:
  - Email (required, validated)
  - Password (min 8 chars, required)
  - First Name (required)
  - Last Name (required)
  - Phone Number (required, format: +1234567890)
- **Validations**:
  - Email format validation
  - Password strength indicator
  - Phone number format
- **Success**: Redirect to login with success message
- **Error Handling**: Display validation errors inline

#### 1.3 Bank Officer Registration
- **Route**: `/register/bank-officer`
- **API**: `POST /auth/register/bank-officer`
- **Form Fields**:
  - Email (required)
  - Password (required)
  - First Name (required)
  - Last Name (required)
  - Phone Number (required)
  - Bank Name (required)
  - Officer ID Number (required)
  - Branch (optional)
- **Features**:
  - Bank auto-complete/dropdown
  - Officer ID validation
- **Success**: Redirect to login

#### 1.4 Login Page
- **Route**: `/login`
- **API**: `POST /auth/login`
- **Form Fields**:
  - Email (required)
  - Password (required)
  - Remember Me (checkbox)
- **Features**:
  - Show/Hide password toggle
  - "Forgot Password" link (future)
  - Rate limiting message display
- **Success**:
  - Save tokens to localStorage/sessionStorage
  - Redirect based on role:
    - Customer → `/dashboard`
    - Bank Officer → `/officer/dashboard`
    - Admin → `/admin/dashboard`
- **Error Handling**:
  - Invalid credentials message
  - Account locked message
  - Too many attempts warning

### 2. Customer Pages (Authenticated)

#### 2.1 Customer Dashboard
- **Route**: `/dashboard`
- **API**:
  - `GET /auth/me` - User info
  - `GET /kyc/credentials?page=1&limit=10` - Credentials
  - `GET /kyc/history?page=1&limit=5` - Recent requests
- **Components**:
  - Welcome message with user name
  - KYC status overview card
  - Active credentials list
  - Recent KYC requests
  - Quick action buttons:
    - Submit New KYC Request
    - View All Credentials
    - View KYC History
- **Data to Display**:
  - Total credentials count
  - Active credentials count
  - Expired credentials count
  - Pending KYC requests count

#### 2.2 Submit KYC Request
- **Route**: `/kyc/submit`
- **API**: `POST /kyc/submit`
- **Form Sections**:

**Section 1: Document Type Selection**
- Radio buttons:
  - Passport
  - National ID
  - Driver's License

**Section 2: Personal Information**
- Full Name (required)
- Date of Birth (required, date picker, must be 18+)
- Nationality (required, dropdown)
- Document Number (required)

**Section 3: Address**
- Street Address (required)
- City (required)
- State/Province (required)
- ZIP/Postal Code (required)
- Country (required, dropdown)

**Section 4: Document Upload**
- Document Front Image (required, accept: image/jpeg, image/png)
- Document Back Image (required)
- Selfie Image (required)
- **Features**:
  - Image preview before upload
  - Drag & drop support
  - File size validation (max 10MB)
  - Convert to base64 before sending

**Section 5: Consent**
- Display required consents
- Checkboxes for each consent type:
  - Data Collection
  - Data Processing
  - Blockchain Storage
- **API**: `POST /consent/bulk-grant`
- All mandatory consents must be checked

**Submission**:
- Progress indicator during submission
- Success: Show request ID and redirect to status page
- Error: Display error message and allow retry

#### 2.3 KYC Status Page
- **Route**: `/kyc/status/:requestId`
- **API**: `GET /kyc/status/:requestId`
- **Components**:
  - Status badge (color-coded):
    - Pending - Yellow
    - Under Review - Blue
    - Approved - Green
    - Rejected - Red
  - Progress tracker/stepper:
    1. Submitted
    2. Under Review
    3. Approved/Rejected
    4. Credential Issued
  - Request details card:
    - Request ID
    - Submission date
    - Document type
    - Current status
  - Verification notes (if any)
  - Action buttons (based on status):
    - View Credential (if approved)
    - Resubmit (if rejected and allowed)
- **Real-time Updates**:
  - Auto-refresh every 30 seconds
  - Or implement WebSocket for live updates

#### 2.4 KYC History
- **Route**: `/kyc/history`
- **API**: `GET /kyc/history?page=1&limit=10&status=all`
- **Components**:
  - Filter dropdown:
    - All
    - Pending
    - Approved
    - Rejected
  - Pagination controls
  - Table/List view:
    - Request ID
    - Status
    - Submission Date
    - Document Type
    - Actions (View Details)
  - Search functionality (by request ID)

#### 2.5 My Credentials
- **Route**: `/credentials`
- **API**: `GET /kyc/credentials?page=1&limit=10&status=all`
- **Components**:
  - Filter tabs:
    - All
    - Active
    - Expired
    - Revoked
  - Credential cards showing:
    - Credential ID
    - Type (Identity Verification, etc.)
    - Status badge
    - Issued Date
    - Expiry Date
    - Days until expiry (if active)
    - Bank name
    - View Details button
  - Expiring soon banner (if credentials expiring in <30 days)
  - Pagination

#### 2.6 Credential Details
- **Route**: `/credentials/:credentialId`
- **API**: `GET /kyc/credentials` (filter by ID)
- **Components**:
  - Credential Information:
    - Credential ID (with copy button)
    - Type
    - Status
    - Issued By (Bank name)
    - Issued Date
    - Expiry Date
    - Validity indicator (Valid/Invalid/Expired)
  - Blockchain Information:
    - Transaction Hash (with link to blockchain explorer)
    - Block Number
    - Credential Hash
    - Network ID
  - KYC Request Reference:
    - Request ID
    - KYC Level
  - Action Buttons:
    - Download as PDF
    - Share (generate temporary access link)
    - Revoke (if applicable)

#### 2.7 Consent Management
- **Route**: `/consents`
- **API**: `GET /consent/my-consents?page=1&limit=10&status=all`
- **Components**:
  - Filter by status:
    - All
    - Granted
    - Denied
    - Revoked
    - Expired
  - Consent list showing:
    - Consent Type
    - Purpose
    - Status
    - Granted/Denied Date
    - Expiry Date
    - Can Be Withdrawn (Yes/No)
  - Actions:
    - View Details
    - Revoke (if canBeWithdrawn=true)

#### 2.8 Profile Settings
- **Route**: `/profile`
- **API**: `GET /auth/me`
- **Sections**:
  - Personal Information (read-only):
    - Email
    - Name
    - Phone
    - Account created date
  - Security:
    - Change Password (future)
    - Two-Factor Authentication (future)
  - Blockchain Wallet:
    - Wallet Address (if set)
    - Setup Wallet (button)

### 3. Bank Officer Pages (Authenticated)

#### 3.1 Officer Dashboard
- **Route**: `/officer/dashboard`
- **API**:
  - `GET /bank/kyc-requests?status=all&page=1&limit=20`
  - Statistics endpoint (future)
- **Components**:
  - Statistics Cards:
    - Total Requests (all time)
    - Pending Requests
    - Approved Today
    - Rejected Today
  - Charts (future):
    - Requests by status (pie chart)
    - Requests over time (line chart)
  - Recent Activity Table:
    - Last 10 requests
    - Quick actions (View, Approve, Reject)
  - Quick Filters:
    - Pending Review
    - Under Review
    - Requires Action

#### 3.2 KYC Requests Queue
- **Route**: `/officer/kyc-requests`
- **API**: `GET /bank/kyc-requests?status=pending&page=1&limit=20&search=`
- **Components**:
  - Filter Panel:
    - Status dropdown (Pending, Under Review, Approved, Rejected, All)
    - Search by name or document number
    - Date range filter
  - Sort Options:
    - Newest First
    - Oldest First
    - Priority
  - Table View:
    - Customer Name
    - Email
    - Document Type
    - Submission Date
    - Status
    - Priority Badge
    - Actions (Review, View Details)
  - Pagination
  - Bulk Actions (future):
    - Assign to me
    - Mark as under review

#### 3.3 KYC Request Review
- **Route**: `/officer/kyc-request/:id`
- **API**:
  - `GET /bank/kyc-request/:id`
  - `POST /bank/verify/:requestId` (approve/reject)
- **Components**:

**Customer Information Panel**:
- Full Name
- Email
- Date of Birth
- Nationality
- Document Type & Number
- Address (full)

**Document Viewer**:
- Tabbed view for images:
  - Document Front
  - Document Back
  - Selfie
- Zoom/Pan functionality
- Download original button
- Side-by-side comparison view

**Verification Checklist** (checkboxes):
- ☐ Document is clear and readable
- ☐ Photo matches selfie
- ☐ Information is consistent
- ☐ No signs of tampering
- ☐ Document is valid and not expired
- ☐ Address proof verified (if required)

**Risk Assessment** (future):
- Risk Score
- Risk Factors
- AML Screening Results

**Action Panel**:
- **Approve Button** (green):
  - Opens modal for verification notes
  - Confirm button
- **Reject Button** (red):
  - Rejection reason dropdown:
    - Incomplete Documents
    - Invalid Documents
    - Failed Verification
    - High Risk
    - Duplicate Account
    - Other
  - Rejection details (textarea)
  - Can Reapply? (checkbox)
  - Confirm button
- **Request More Info** (future)
- **Assign to Another Officer** (future)

**Activity Timeline**:
- Show all status changes
- Who performed action
- When
- Notes/Comments

#### 3.4 Issue Credential
- **Route**: `/officer/issue-credential/:requestId`
- **API**: `POST /bank/issue-credential`
- **Pre-requisites**: KYC must be approved
- **Components**:
  - Request Summary:
    - Customer Name
    - Request ID
    - Approval Date
  - Credential Details Form:
    - Credential Type (dropdown):
      - Identity Verification
      - Address Verification
      - Document Verification
    - Expiry Date (date picker, default: +1 year)
  - Blockchain Information:
    - Customer Wallet Address (auto-filled)
    - Network (display only)
  - Issue Button:
    - Show loading spinner during blockchain transaction
    - Display transaction progress
  - Success State:
    - Show transaction hash
    - Show credential ID
    - Link to view credential
    - "Issue Another" button

#### 3.5 Issued Credentials
- **Route**: `/officer/credentials`
- **Purpose**: View all credentials issued by this officer
- **Components**:
  - Filter by date range
  - Search by customer name/credential ID
  - Table view:
    - Credential ID
    - Customer Name
    - Type
    - Issued Date
    - Expiry Date
    - Status
    - Transaction Hash
    - Actions (View Details)

### 4. Common Components (Reusable)

#### 4.1 Navigation Bar
- **Logged Out**:
  - Logo
  - Home
  - About
  - Login
  - Register
- **Customer**:
  - Logo
  - Dashboard
  - Submit KYC
  - My Credentials
  - Consents
  - Profile
  - Logout
- **Bank Officer**:
  - Logo
  - Dashboard
  - KYC Queue
  - Issue Credential
  - Profile
  - Logout

#### 4.2 Status Badge Component
Props: status, size
Colors:
- `pending` - Yellow (#FFC107)
- `under_review` - Blue (#2196F3)
- `approved` - Green (#4CAF50)
- `rejected` - Red (#F44336)
- `active` - Green (#4CAF50)
- `expired` - Gray (#9E9E9E)
- `revoked` - Red (#F44336)

#### 4.3 Loading States
- Skeleton loaders for tables
- Spinner for button actions
- Progress bar for file uploads
- Full-page loader for initial data fetch

#### 4.4 Error Messages
- Toast notifications for success/error
- Inline validation errors
- 404 page
- 403 Forbidden page
- 500 Server Error page

#### 4.5 Confirmation Modals
- For destructive actions (reject KYC, revoke consent, etc.)
- Show consequences
- Require confirmation

---

## API Integration Examples

### JavaScript/TypeScript Examples

#### 1. Authentication Service

```javascript
// authService.js
const API_BASE_URL = 'http://localhost:5000/api/v1';

class AuthService {
  async register(userData, role = 'customer') {
    const endpoint = role === 'customer'
      ? '/auth/register/customer'
      : '/auth/register/bank-officer';

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();

    // Store tokens
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    return data.data;
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    // Store tokens
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));

    return data.data;
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.data.accessToken);

    return data.data.accessToken;
  }

  async getCurrentUser() {
    const response = await this.authenticatedFetch('/auth/me');
    return response.data;
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!this.getAccessToken();
  }

  async authenticatedFetch(endpoint, options = {}) {
    const token = this.getAccessToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    // Handle 401 - Try to refresh token
    if (response.status === 401) {
      try {
        const newToken = await this.refreshToken();
        // Retry request with new token
        return await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...options.headers,
          },
        });
      } catch (error) {
        this.logout();
        throw error;
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return await response.json();
  }
}

export default new AuthService();
```

#### 2. KYC Service

```javascript
// kycService.js
import authService from './authService';

class KYCService {
  async submitKYC(kycData) {
    // Convert images to base64 if needed
    const payload = {
      documentType: kycData.documentType,
      documentNumber: kycData.documentNumber,
      fullName: kycData.fullName,
      dateOfBirth: kycData.dateOfBirth,
      nationality: kycData.nationality,
      address: kycData.address,
      documentFrontImage: await this.imageToBase64(kycData.documentFront),
      documentBackImage: await this.imageToBase64(kycData.documentBack),
      selfieImage: await this.imageToBase64(kycData.selfie),
    };

    return await authService.authenticatedFetch('/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getKYCStatus(requestId) {
    return await authService.authenticatedFetch(`/kyc/status/${requestId}`);
  }

  async getKYCHistory(params = {}) {
    const { page = 1, limit = 10, status = 'all' } = params;
    const queryParams = new URLSearchParams({ page, limit, status });

    return await authService.authenticatedFetch(
      `/kyc/history?${queryParams}`
    );
  }

  async getCredentials(params = {}) {
    const { page = 1, limit = 10, status = 'all' } = params;
    const queryParams = new URLSearchParams({ page, limit, status });

    return await authService.authenticatedFetch(
      `/kyc/credentials?${queryParams}`
    );
  }

  // Helper: Convert File to Base64
  imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export default new KYCService();
```

#### 3. Bank Officer Service

```javascript
// bankService.js
import authService from './authService';

class BankService {
  async getKYCRequests(params = {}) {
    const {
      page = 1,
      limit = 20,
      status = 'all',
      search = ''
    } = params;

    const queryParams = new URLSearchParams({ page, limit, status, search });

    return await authService.authenticatedFetch(
      `/bank/kyc-requests?${queryParams}`
    );
  }

  async getKYCRequestDetails(requestId) {
    return await authService.authenticatedFetch(
      `/bank/kyc-request/${requestId}`
    );
  }

  async verifyKYC(requestId, action, notes) {
    return await authService.authenticatedFetch(
      `/bank/verify/${requestId}`,
      {
        method: 'POST',
        body: JSON.stringify({
          action, // 'approve' or 'reject'
          verificationNotes: notes,
        }),
      }
    );
  }

  async issueCredential(requestId, credentialData) {
    return await authService.authenticatedFetch(
      '/bank/issue-credential',
      {
        method: 'POST',
        body: JSON.stringify({
          requestId,
          credentialType: credentialData.credentialType,
          expiryDate: credentialData.expiryDate,
        }),
      }
    );
  }
}

export default new BankService();
```

#### 4. Consent Service

```javascript
// consentService.js
import authService from './authService';

class ConsentService {
  async getMyConsents(params = {}) {
    const { page = 1, limit = 10, status = 'all' } = params;
    const queryParams = new URLSearchParams({ page, limit, status });

    return await authService.authenticatedFetch(
      `/consent/my-consents?${queryParams}`
    );
  }

  async getConsentDetails(consentId) {
    return await authService.authenticatedFetch(`/consent/${consentId}`);
  }

  async grantConsent(consentId) {
    return await authService.authenticatedFetch(
      `/consent/${consentId}/grant`,
      {
        method: 'POST',
        body: JSON.stringify({ agreed: true }),
      }
    );
  }

  async denyConsent(consentId, reason) {
    return await authService.authenticatedFetch(
      `/consent/${consentId}/deny`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  }

  async revokeConsent(consentId, reason) {
    return await authService.authenticatedFetch(
      `/consent/${consentId}/revoke`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );
  }

  async bulkGrantConsents(consentIds) {
    return await authService.authenticatedFetch('/consent/bulk-grant', {
      method: 'POST',
      body: JSON.stringify({
        consentIds,
        agreed: true,
      }),
    });
  }
}

export default new ConsentService();
```

### React Example - Submit KYC Form

```jsx
// SubmitKYCForm.jsx
import React, { useState } from 'react';
import kycService from '../services/kycService';

function SubmitKYCForm() {
  const [formData, setFormData] = useState({
    documentType: 'passport',
    documentNumber: '',
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    documentFront: null,
    documentBack: null,
    selfie: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await kycService.submitKYC(formData);

      // Show success message
      alert(`KYC submitted successfully! Request ID: ${result.data.requestId}`);

      // Redirect to status page
      window.location.href = `/kyc/status/${result.data._id}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="kyc-form">
      <h2>Submit KYC Request</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Document Type */}
      <div className="form-group">
        <label>Document Type</label>
        <select
          name="documentType"
          value={formData.documentType}
          onChange={handleInputChange}
          required
        >
          <option value="passport">Passport</option>
          <option value="national_id">National ID</option>
          <option value="drivers_license">Driver's License</option>
        </select>
      </div>

      {/* Personal Info */}
      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Document Number</label>
        <input
          type="text"
          name="documentNumber"
          value={formData.documentNumber}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Date of Birth</label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Nationality</label>
        <input
          type="text"
          name="nationality"
          value={formData.nationality}
          onChange={handleInputChange}
          required
        />
      </div>

      {/* Address */}
      <h3>Address</h3>
      <div className="form-group">
        <label>Street Address</label>
        <input
          type="text"
          name="address.street"
          value={formData.address.street}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>City</label>
        <input
          type="text"
          name="address.city"
          value={formData.address.city}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>State/Province</label>
        <input
          type="text"
          name="address.state"
          value={formData.address.state}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>ZIP/Postal Code</label>
        <input
          type="text"
          name="address.zipCode"
          value={formData.address.zipCode}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Country</label>
        <input
          type="text"
          name="address.country"
          value={formData.address.country}
          onChange={handleInputChange}
          required
        />
      </div>

      {/* Document Uploads */}
      <h3>Document Images</h3>
      <div className="form-group">
        <label>Document Front</label>
        <input
          type="file"
          name="documentFront"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          required
        />
        {formData.documentFront && (
          <img
            src={URL.createObjectURL(formData.documentFront)}
            alt="Preview"
            className="image-preview"
          />
        )}
      </div>

      <div className="form-group">
        <label>Document Back</label>
        <input
          type="file"
          name="documentBack"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          required
        />
        {formData.documentBack && (
          <img
            src={URL.createObjectURL(formData.documentBack)}
            alt="Preview"
            className="image-preview"
          />
        )}
      </div>

      <div className="form-group">
        <label>Selfie Photo</label>
        <input
          type="file"
          name="selfie"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          required
        />
        {formData.selfie && (
          <img
            src={URL.createObjectURL(formData.selfie)}
            alt="Preview"
            className="image-preview"
          />
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit KYC Request'}
      </button>
    </form>
  );
}

export default SubmitKYCForm;
```

---

## Authentication Flow

### 1. Initial Login Flow

```
User Enters Credentials
        ↓
POST /auth/login
        ↓
Receive Access Token (15min) + Refresh Token (7 days)
        ↓
Store in localStorage/sessionStorage
        ↓
Include Access Token in all requests:
Header: Authorization: Bearer <access_token>
```

### 2. Token Refresh Flow

```
API Request with Access Token
        ↓
Response: 401 Unauthorized
        ↓
POST /auth/refresh with Refresh Token
        ↓
Receive New Access Token
        ↓
Retry Original Request with New Token
        ↓
If Refresh Fails → Logout User
```

### 3. Automatic Token Refresh (Recommended)

Set up an Axios/Fetch interceptor:

```javascript
// axiosConfig.js
import axios from 'axios';
import authService from './authService';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

// Request interceptor - Add token
api.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await authService.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        authService.logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

| Code | Meaning | Frontend Action |
|------|---------|-----------------|
| 200 | Success | Process data |
| 201 | Created | Show success, redirect |
| 400 | Bad Request | Show validation errors |
| 401 | Unauthorized | Try token refresh, then logout |
| 403 | Forbidden | Show permission error |
| 404 | Not Found | Show "not found" message |
| 409 | Conflict | Show conflict message (duplicate) |
| 429 | Too Many Requests | Show rate limit message |
| 500 | Server Error | Show generic error, log to console |

### Error Handling Example

```javascript
// errorHandler.js
export const handleAPIError = (error) => {
  // Network error
  if (!error.response) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to server. Please check your internet connection.',
    };
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      return {
        title: 'Validation Error',
        message: data.message || 'Please check your input',
        errors: data.errors || [],
      };

    case 401:
      return {
        title: 'Authentication Required',
        message: 'Please login to continue',
        action: 'redirect_login',
      };

    case 403:
      return {
        title: 'Access Denied',
        message: 'You do not have permission to perform this action',
      };

    case 404:
      return {
        title: 'Not Found',
        message: 'The requested resource was not found',
      };

    case 409:
      return {
        title: 'Conflict',
        message: data.message || 'A conflict occurred',
      };

    case 429:
      return {
        title: 'Too Many Requests',
        message: 'Please wait a moment before trying again',
      };

    case 500:
    default:
      return {
        title: 'Server Error',
        message: 'Something went wrong. Please try again later.',
      };
  }
};

// Usage in component
try {
  await kycService.submitKYC(data);
} catch (error) {
  const errorInfo = handleAPIError(error);
  showToast(errorInfo.title, errorInfo.message, 'error');
}
```

---

## Best Practices

### 1. Security

✅ **DO:**
- Store tokens in `httpOnly` cookies (if possible) or `localStorage`
- Always send tokens in `Authorization` header
- Implement CSRF protection for cookie-based auth
- Validate all user input before sending to API
- Use HTTPS in production
- Implement rate limiting on frontend (prevent spam)
- Clear tokens on logout
- Handle token expiration gracefully

❌ **DON'T:**
- Store tokens in `sessionStorage` for production (less secure)
- Include tokens in URL parameters
- Log sensitive data to console in production
- Trust client-side validation alone

### 2. Performance

✅ **DO:**
- Implement pagination for all lists
- Use debouncing for search inputs
- Cache API responses when appropriate
- Lazy load images
- Show loading states
- Use optimistic UI updates
- Implement infinite scroll for long lists

### 3. User Experience

✅ **DO:**
- Show clear loading indicators
- Display helpful error messages
- Implement auto-save for forms (draft)
- Show progress for multi-step forms
- Confirm destructive actions
- Show success feedback
- Auto-refresh status pages
- Enable keyboard navigation
- Make it mobile responsive

### 4. Code Organization

```
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── StatusBadge.jsx
│   │   └── LoadingSpinner.jsx
│   ├── customer/
│   │   ├── Dashboard.jsx
│   │   ├── SubmitKYC.jsx
│   │   └── CredentialList.jsx
│   └── officer/
│       ├── Dashboard.jsx
│       ├── KYCQueue.jsx
│       └── ReviewRequest.jsx
├── services/
│   ├── authService.js
│   ├── kycService.js
│   ├── bankService.js
│   └── consentService.js
├── hooks/
│   ├── useAuth.js
│   ├── useKYC.js
│   └── usePagination.js
├── utils/
│   ├── errorHandler.js
│   ├── validators.js
│   └── formatters.js
├── routes/
│   ├── PrivateRoute.jsx
│   └── RoleRoute.jsx
└── App.jsx
```

---

## Testing the Integration

### 1. Test Customer Flow

```bash
# 1. Register a customer
curl -X POST http://localhost:5000/api/v1/auth/register/customer \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@customer.com",
    "password": "Test@12345",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }'

# Save the accessToken from response

# 2. Submit KYC (replace TOKEN)
curl -X POST http://localhost:5000/api/v1/kyc/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "documentType": "passport",
    "documentNumber": "P123456",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "nationality": "US",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "documentFrontImage": "data:image/png;base64,iVBORw0KG...",
    "documentBackImage": "data:image/png;base64,iVBORw0KG...",
    "selfieImage": "data:image/png;base64,iVBORw0KG..."
  }'
```

### 2. Run Demo Script

The backend includes a complete demo script:

```bash
# Terminal 1: Make sure backend is running
cd /home/ursus/projects/eKYC/eKYC/backend
npm run dev

# Terminal 2: Run demo
cd /home/ursus/projects/eKYC/eKYC
npm run demo

# This will:
# 1. Register customer
# 2. Submit KYC
# 3. Register bank officer
# 4. Approve KYC
# 5. Issue credential
# 6. Retrieve credential
```

---

## Additional Resources

### Documentation Files

- **Complete API Reference**: `backend/API_DOCUMENTATION.md`
- **Credential Model Details**: `backend/CREDENTIAL_MODEL_IMPLEMENTATION.md`
- **Testing Guide**: `backend/E2E_TESTING_GUIDE.md`
- **Quick Start**: `TESTING_QUICK_START.md`
- **Project README**: `README.md`

### Support & Issues

- Backend API Issues: Check `backend/API_DOCUMENTATION.md`
- Blockchain Issues: Check `backend/src/services/blockchain/README.md`
- General Questions: Refer to project documentation

---

## Summary Checklist for Frontend Developer

### Before Starting Development:

- [ ] Read this entire guide
- [ ] Review `backend/API_DOCUMENTATION.md`
- [ ] Start all backend services (Docker, Hardhat optional, Backend)
- [ ] Test backend health endpoint
- [ ] Run demo script to understand flow
- [ ] Set up API service layer in frontend
- [ ] Implement authentication service first
- [ ] Test login/register flows

### Development Order:

1. **Week 1**: Authentication & Navigation
   - Login/Register pages
   - Token management
   - Navigation components
   - Protected routes

2. **Week 2**: Customer Pages
   - Dashboard
   - Submit KYC form
   - KYC status page
   - Credentials list

3. **Week 3**: Bank Officer Pages
   - Officer dashboard
   - KYC queue
   - Review page
   - Issue credential

4. **Week 4**: Polish & Testing
   - Error handling
   - Loading states
   - Mobile responsive
   - Integration testing

---

## Quick Command Reference

```bash
# Start everything (in separate terminals)

# Terminal 1: Docker
docker-compose up -d

# Terminal 2: Hardhat (optional)
cd blockchain && npm run node

# Terminal 3: Deploy Contracts (optional, after Terminal 2 starts)
cd blockchain && npm run deploy:local

# Terminal 4: Backend
cd backend && npm run dev

# Test backend
curl http://localhost:5000/health

# Run demo
npm run demo
```

---

**Questions?** Refer to the detailed API documentation in `backend/API_DOCUMENTATION.md` or review the integration test examples in `backend/src/tests/api/`.

**Good luck with your frontend development!** 🚀
