# Complete Integration Guide

This comprehensive guide covers both backend API integration and frontend-backend integration for the eKYC system.

## Table of Contents
- [Backend API Integration](#backend-api-integration)
- [Frontend-Backend Integration](#frontend-backend-integration)
- [API Endpoints Reference](#api-endpoints-reference)
- [Integration Examples](#integration-examples)
- [Troubleshooting](#troubleshooting)

---

## Backend API Integration

### Overview

This section summarizes the API integration work completed for the eKYC Blockchain System, including all customer-facing APIs, bank APIs, error handling, testing, and documentation.

### What Was Done

#### 1. Updated Main Application

**Added Global Error Handler:**
- Created `middleware/errorHandler.js` - Centralized error handling middleware
- Created `middleware/notFound.js` - 404 handler for undefined routes
- Handles various error types:
  - Mongoose validation errors
  - JWT authentication errors
  - File upload errors (Multer)
  - Database errors (duplicate keys, cast errors)
  - Custom application errors

**Existing Configuration:**
- Security middleware (Helmet, CORS, rate limiting)
- Request logging (Morgan)
- Data sanitization (NoSQL injection, XSS protection)
- Compression
- Static file serving

**Registered Routes:**
- `/api/v1/auth` - Authentication routes
- `/api/v1/kyc` - Customer KYC routes
- `/api/v1/bank` - Bank officer routes
- `/api/v1/consent` - Consent management routes

#### 2. Integration Tests

**Test Coverage:**

**Authentication Tests:**
- ✓ Customer registration with validation
- ✓ Bank officer registration with validation
- ✓ Login with valid/invalid credentials
- ✓ Get current user details
- ✓ Logout functionality
- ✓ Duplicate email prevention
- ✓ Required field validation

**KYC Tests:**
- ✓ Submit KYC request with documents
- ✓ Get KYC status by ID
- ✓ Get KYC history with pagination
- ✓ Get customer credentials
- ✓ Authentication requirement
- ✓ Field validation

**Bank Officer Tests:**
- ✓ Get KYC requests with filters
- ✓ Get detailed KYC request
- ✓ Approve KYC request
- ✓ Reject KYC request
- ✓ Role-based access control
- ✓ Action validation

**Consent Tests:**
- ✓ Create consent requests
- ✓ Grant/deny/revoke consents
- ✓ Bulk grant consents
- ✓ Get consent history

**Complete Workflow Test:**
- ✓ End-to-end KYC flow from registration to verification
- Tests all APIs in sequence
- Verifies data flow between endpoints

**Usage:**
```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# With coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

### API Endpoints Summary

#### Authentication APIs (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register/customer` | Public | Register new customer |
| POST | `/register/bank-officer` | Public | Register new bank officer |
| POST | `/login` | Public | Authenticate user |
| POST | `/refresh` | Public | Refresh access token |
| GET | `/me` | Private | Get current user |
| POST | `/logout` | Private | Logout user |

#### KYC APIs (`/api/v1/kyc`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/submit` | Customer | Submit KYC request |
| GET | `/status/:requestId` | Customer | Get KYC status |
| GET | `/history` | Customer | Get KYC history |
| GET | `/credentials` | Customer | Get blockchain credentials |

#### Bank APIs (`/api/v1/bank`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/kyc-requests` | Bank Officer | Get KYC requests |
| GET | `/kyc-request/:id` | Bank Officer | Get KYC details |
| POST | `/verify/:requestId` | Bank Officer | Approve/reject KYC |
| POST | `/issue-credential` | Bank Officer | Issue blockchain credential |

#### Consent APIs (`/api/v1/consent`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/my-consents` | Customer | Get user consents |
| GET | `/:consentId` | Customer | Get consent details |
| POST | `/:consentId/grant` | Customer | Grant consent |
| POST | `/:consentId/deny` | Customer | Deny consent |
| POST | `/:consentId/revoke` | Customer | Revoke consent |
| POST | `/bulk-grant` | Customer | Grant multiple consents |

### Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (Customer, Bank Officer, Admin)
   - Token refresh mechanism

2. **Rate Limiting**
   - General API: 100 req/15min
   - Login: 5 req/5min
   - KYC submission: 5 req/hour
   - Credential issuance: 10 req/hour

3. **Data Protection**
   - Helmet.js for HTTP headers
   - CORS configuration
   - NoSQL injection prevention
   - XSS protection
   - HTTP parameter pollution prevention

4. **Error Handling**
   - Centralized error handling
   - Consistent error format
   - No sensitive data in errors (production)
   - Stack traces in development only

---

## Frontend-Backend Integration

### Integration Status: COMPLETE ✅

This section summarizes the complete integration of the eKYC frontend with the backend API.

### What Was Done

#### 1. API Services Layer

All API services are fully integrated with real backend endpoints:

**Authentication Service** (`authService.ts`)
- ✅ Customer registration: `POST /auth/register/customer`
- ✅ Bank officer registration: `POST /auth/register/bank-officer`
- ✅ User login: `POST /auth/login`
- ✅ Token refresh: `POST /auth/refresh`
- ✅ Get current user: `GET /auth/me`
- ✅ Logout: `POST /auth/logout`

**KYC Service** (`kycService.ts`)
- ✅ Submit KYC request: `POST /kyc/submit`
- ✅ Get KYC status: `GET /kyc/status/:requestId`
- ✅ Get KYC history: `GET /kyc/history`
- ✅ Get credentials: `GET /kyc/credentials`
- ✅ File to base64 conversion helper

**Bank Service** (`bankService.ts`)
- ✅ Get KYC requests: `GET /bank/kyc-requests`
- ✅ Get KYC request details: `GET /bank/kyc-request/:id`
- ✅ Verify KYC: `POST /bank/verify/:requestId`
- ✅ Issue credential: `POST /bank/issue-credential`

**Consent Service** (`consentService.ts`)
- ✅ Get user consents: `GET /consent/my-consents`
- ✅ Get consent details: `GET /consent/:consentId`
- ✅ Grant consent: `POST /consent/:consentId/grant`
- ✅ Deny consent: `POST /consent/:consentId/deny`
- ✅ Revoke consent: `POST /consent/:consentId/revoke`
- ✅ Bulk grant consents: `POST /consent/bulk-grant`

#### 2. API Client Configuration

- ✅ Axios instance with base URL configuration
- ✅ Request interceptor for automatic token injection
- ✅ Response interceptor for token refresh handling
- ✅ Automatic redirect on 401 errors
- ✅ Token management (access + refresh tokens)
- ✅ User state persistence in localStorage

#### 3. Error Handling

Created comprehensive error handling utilities:
- ✅ `getErrorMessage()` - Extract user-friendly error messages
- ✅ `getValidationErrors()` - Parse validation errors from API
- ✅ `formatErrorForDisplay()` - Format errors for UI display
- ✅ `isAuthError()` - Check for authentication errors
- ✅ `isNetworkError()` - Detect network connectivity issues
- ✅ Status code-based error messages (400, 401, 403, 404, 429, 500, etc.)

#### 4. Environment Configuration

- ✅ `.env.development` - Development environment (localhost:5001)
- ✅ `.env.production` - Production environment (customizable API URL)
- ✅ `.env.example` - Example configuration file
- ✅ Environment variable validation in `vite-env.d.ts`

#### 5. Build & Deployment Configuration

**Vite Configuration:**
- ✅ Path aliases for clean imports (`@`, `@components`, etc.)
- ✅ Development proxy to backend
- ✅ Production build optimizations:
  - Terser minification
  - Console logs removed
  - Code splitting (vendor, ui, query chunks)
  - Source maps disabled
  - Chunk size warnings configured

**Docker Configuration:**
- ✅ Multi-stage Dockerfile (builder + nginx)
- ✅ Optimized nginx configuration
- ✅ Docker Compose setup
- ✅ Health checks configured
- ✅ `.dockerignore` file

### Data Flow

#### Authentication Flow
```
User Input → AuthService → API Client → Backend API
                ↓                           ↓
          Store Tokens              Validate & Create Session
                ↓                           ↓
         Update AuthContext          Return User + Tokens
                ↓
         Redirect to Dashboard
```

#### KYC Submission Flow
```
User Form → File Upload → Base64 Conversion → KYC Service
                                                    ↓
                                            POST /kyc/submit
                                                    ↓
                                              Backend Processing
                                                    ↓
                                          Return Request ID & Status
                                                    ↓
                                        Redirect to Status Page
```

#### Protected Route Flow
```
Route Access → PrivateRoute Component → Check Auth Status
                                              ↓
                                        Authenticated?
                                         /          \
                                      Yes            No
                                       ↓              ↓
                                  Load Page    Redirect to Login
```

### Security Features

1. **JWT Token Management**
   - Access tokens stored in localStorage
   - Refresh tokens handled automatically
   - Automatic token refresh before expiration
   - Logout clears all stored tokens

2. **API Security**
   - Authorization header automatically added
   - HTTPS enforced in production
   - CORS properly configured
   - Input validation on frontend and backend

3. **Route Protection**
   - Private routes require authentication
   - Role-based access control
   - Automatic redirect for unauthorized access

### API Endpoints Mapping

| Frontend Service                 | Backend Route               | Method | Auth Required | Role         |
| -------------------------------- | --------------------------- | ------ | ------------- | ------------ |
| authService.registerCustomer     | /auth/register/customer     | POST   | No            | -            |
| authService.registerBankOfficer  | /auth/register/bank-officer | POST   | No            | -            |
| authService.login                | /auth/login                 | POST   | No            | -            |
| authService.getCurrentUser       | /auth/me                    | GET    | Yes           | Any          |
| authService.logout               | /auth/logout                 | POST   | Yes           | Any          |
| authService.refreshToken         | /auth/refresh               | POST   | No            | -            |
| kycService.submitKyc             | /kyc/submit                 | POST   | Yes           | Customer     |
| kycService.getKycStatus          | /kyc/status/:requestId      | GET    | Yes           | Customer     |
| kycService.getKycHistory         | /kyc/history                | GET    | Yes           | Customer     |
| kycService.getCredentials        | /kyc/credentials            | GET    | Yes           | Customer     |
| bankService.getKycRequests       | /bank/kyc-requests          | GET    | Yes           | Bank Officer |
| bankService.getKycRequestDetails | /bank/kyc-request/:id       | GET    | Yes           | Bank Officer |
| bankService.verifyKyc            | /bank/verify/:requestId     | POST   | Yes           | Bank Officer |
| bankService.issueCredential      | /bank/issue-credential      | POST   | Yes           | Bank Officer |
| consentService.getMyConsents     | /consent/my-consents        | GET    | Yes           | Any          |
| consentService.getConsentDetails | /consent/:consentId         | GET    | Yes           | Any          |
| consentService.grantConsent      | /consent/:consentId/grant   | POST   | Yes           | Customer     |
| consentService.denyConsent       | /consent/:consentId/deny    | POST   | Yes           | Customer     |
| consentService.revokeConsent     | /consent/:consentId/revoke  | POST   | Yes           | Customer     |
| consentService.bulkGrantConsents | /consent/bulk-grant         | POST   | Yes           | Customer     |

---

## Integration Examples

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
      nid_number: kycData.nid_number,
      full_name: kycData.full_name,
      date_of_birth: kycData.date_of_birth,
      address: kycData.address,
      father_name: kycData.father_name,
      mother_name: kycData.mother_name,
      phone: kycData.phone,
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
}

export default new KYCService();
```

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors
**Error:** `Access-Control-Allow-Origin` header missing

**Solution:**
- Ensure backend CORS is configured correctly
- Check that frontend URL is in allowed origins
- Verify API base URL matches backend server

#### 2. Token Refresh Issues
**Error:** 401 Unauthorized after token expires

**Solution:**
- Check that refresh token is stored correctly
- Verify refresh endpoint is working
- Ensure token refresh logic is implemented in API client

#### 3. API Connection Errors
**Error:** Network error or connection refused

**Solution:**
- Verify backend server is running
- Check API base URL in frontend configuration
- Ensure ports match (backend: 5000/5001, frontend: 3000)

#### 4. Authentication Errors
**Error:** Invalid token or unauthorized access

**Solution:**
- Clear localStorage and re-login
- Check token expiration times
- Verify JWT secret matches between frontend and backend

---

## Summary

✅ **Backend Integration:**
- All API endpoints implemented and tested
- Comprehensive error handling
- Security middleware configured
- Integration tests passing

✅ **Frontend Integration:**
- All API services connected to real backend
- Token management working
- Error handling comprehensive
- Production build successful

**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT

**Last Updated:** December 2024

