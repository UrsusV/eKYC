# Architecture Diagram Generation Prompt for Gemini

## Prompt for Gemini AI

```
Create a comprehensive, professional architecture diagram for an eKYC (Electronic Know Your Customer) Blockchain System. The diagram should be visually clear, well-organized, and suitable for a technical presentation or documentation.

### System Overview:
This is a full-stack web application that combines traditional MERN stack technologies with Ethereum blockchain integration for issuing immutable digital credentials after KYC verification.

### Architecture Layers to Include:

#### 1. FRONTEND LAYER (Top)
- **Technology**: React 18 + TypeScript, Vite, Tailwind CSS
- **Components**:
  - Customer Dashboard (KYC submission, status tracking, credentials view)
  - Bank Officer Dashboard (KYC review, approval, credential issuance)
  - Public Pages (Login, Registration)
- **State Management**: React Context API + TanStack React Query
- **Routing**: React Router DOM v6
- **API Client**: Axios

**Connection**: Frontend makes HTTP/REST requests to Backend API (Port 3000 → 5000)

#### 2. BACKEND LAYER (Middle - Main Application Server)
- **Technology**: Node.js 18+ with Express.js
- **Port**: 5000

**Sub-layers**:

a) **API Routes Layer**:
   - `/api/v1/auth` - Authentication endpoints (register, login, refresh, logout)
   - `/api/v1/kyc` - KYC management (submit, status, history, credentials)
   - `/api/v1/bank` - Bank officer operations (review, approve, issue)
   - `/api/v1/consent` - Consent management (grant, revoke, list)

b) **Middleware Layer**:
   - JWT Authentication & Authorization
   - Role-Based Access Control (RBAC)
   - Rate Limiting (100 req/15min)
   - Input Validation (express-validator, Joi)
   - Security Headers (Helmet, CORS)
   - NoSQL Injection & XSS Prevention
   - Error Handling

c) **Service/Business Logic Layer**:
   - KYC Service (request processing, validation)
   - Authentication Service (JWT, password hashing)
   - Blockchain Service (~4,540 lines of code)
     - CredentialService (main API)
     - BlockchainProvider (network management)
     - WalletManager (wallet operations)
     - ContractManager (smart contract calls)
     - TransactionManager (gas, nonce, retry logic)
     - EventListener (blockchain events)
     - TransactionQueue (priority queue)

d) **Data Access Layer (Models)**:
   - User Model (customers, bank officers, admins)
   - KycRequest Model (verification workflow)
   - Bank Model (authorized issuers)
   - Credential Model (blockchain credentials)
   - Document Model (KYC documents)
   - Consent Model (access permissions)
   - AuditLog Model (system events)

**Connections**: 
- Backend connects to MongoDB (Port 27017)
- Backend connects to Redis (Port 6379)
- Backend connects to Blockchain Network (Port 8545)

#### 3. DATA LAYER (Bottom Left - Docker Services)

a) **MongoDB (Port 27017)**:
   - Primary database for application data
   - Collections: users, kycRequests, banks, credentials, documents, consents, auditLogs
   - Authentication: admin / eKYC_Admin_2025

b) **Redis (Port 6379)**:
   - Session cache (JWT refresh tokens)
   - Rate limiting counters
   - Token blacklist
   - Temporary data (OTP, verification codes)
   - Password: eKYC_Redis_2025

c) **Database Management UIs**:
   - Mongo Express (Port 8081) - MongoDB GUI
   - Redis Commander (Port 8082) - Redis GUI

**All data services run in Docker containers**

#### 4. BLOCKCHAIN LAYER (Bottom Right)

a) **Hardhat Network (Development)**:
   - Local Ethereum node (Port 8545)
   - Fast mining for development
   - 20 pre-funded test accounts

b) **Sepolia Testnet (Testing)**:
   - Ethereum testnet
   - Connection via Infura/Alchemy RPC

c) **Smart Contract: CredentialRegistry.sol**:
   - **Technology**: Solidity 0.8.x
   - **Functions**:
     - `issueCredential()` - Issue new credential on-chain
     - `verifyCredential()` - Verify credential validity
     - `revokeCredential()` - Revoke issued credential
     - `grantConsent()` - Grant access to verifiers
     - `addAuthorizedIssuer()` - Authorize banks (admin only)
   - **Storage**:
     - Credentials mapping (credentialId → Credential struct)
     - Holder credentials (address → credentialIds[])
     - Authorized issuers (address → bool)
   - **Events**: CredentialIssued, CredentialRevoked, ConsentGranted

**Deployment**: Hardhat framework with ethers.js v6

### Data Flow Examples to Illustrate:

#### Flow 1: Customer KYC Submission
1. Customer fills form in Frontend
2. Frontend sends POST to `/api/v1/kyc/submit`
3. Backend validates input (middleware)
4. Backend creates KycRequest in MongoDB
5. Backend generates unique Request ID (KYC2412XXXXX)
6. Backend returns success with Request ID

#### Flow 2: Bank Officer Approval & Blockchain Issuance
1. Officer reviews KYC in Frontend
2. Frontend sends POST to `/api/v1/bank/verify/:id` (approved)
3. Backend updates KycRequest status to 'approved' in MongoDB
4. Officer clicks "Issue Credential"
5. Frontend sends POST to `/api/v1/bank/issue-credential`
6. Backend creates credential hash (SHA256)
7. Backend calls Blockchain Service
8. Blockchain Service calls smart contract `issueCredential()`
9. Transaction submitted to Ethereum network
10. Smart contract stores credential on-chain
11. Transaction hash + block number returned
12. Backend stores credential in MongoDB with blockchain references
13. Frontend displays success with blockchain explorer link

#### Flow 3: Credential Verification
1. Customer views credentials in Frontend
2. Frontend fetches from `/api/v1/kyc/credentials`
3. Backend queries MongoDB for credentials
4. Backend verifies each credential on blockchain
5. Backend calls smart contract `verifyCredential()`
6. Returns credential status (active/revoked) to Frontend

### Visual Design Requirements:

1. **Use distinct colors for each layer**:
   - Frontend: Blue/Cyan
   - Backend API: Green
   - Services: Yellow/Orange
   - Database: Purple/Magenta
   - Blockchain: Red/Orange

2. **Show clear directional arrows** indicating data flow:
   - HTTP/REST requests (Frontend ↔ Backend)
   - Database queries (Backend → MongoDB/Redis)
   - Blockchain transactions (Backend → Smart Contract)
   - Solid arrows for synchronous calls
   - Dashed arrows for asynchronous events

3. **Include port numbers** on connections:
   - Frontend: 3000
   - Backend: 5000
   - MongoDB: 27017
   - Redis: 6379
   - Hardhat: 8545
   - Mongo Express: 8081
   - Redis Commander: 8082

4. **Label all components** with:
   - Component name
   - Technology/framework used
   - Key responsibilities (bullet points)

5. **Add icons/symbols** for:
   - 🔒 Security components (JWT, encryption)
   - 🔗 Blockchain components
   - 💾 Database components
   - 🐳 Docker containers
   - ⚡ Cache/Redis

6. **Group related components** with boxes/containers:
   - Frontend tier (one large box)
   - Backend tier with sub-boxes (Routes, Middleware, Services, Models)
   - Data tier (Docker services box)
   - Blockchain tier (smart contract box)

7. **Include a legend** explaining:
   - Arrow types (HTTP, DB query, blockchain TX)
   - Color coding
   - Icons/symbols used

8. **Add network boundaries**:
   - Internet/Public (Frontend)
   - Application Layer (Backend)
   - Data Layer (Databases)
   - Blockchain Network

### Additional Context:

**User Roles**:
- Customer: Submit KYC, view status, retrieve credentials
- Bank Officer: Review KYC, approve/reject, issue blockchain credentials
- Admin: System management (future)

**Security Features**:
- JWT authentication (15min access, 7day refresh tokens)
- bcrypt password hashing (12 rounds)
- Rate limiting (100 requests/15 minutes)
- CORS protection
- Helmet security headers
- Input sanitization (NoSQL injection, XSS)

**Blockchain Features**:
- Immutable credential storage
- On-chain verification
- Access control (only authorized issuers)
- Event emission for auditability
- Gas optimization with EIP-1559

**Performance**:
- Database indexing on frequently queried fields
- Redis caching for sessions
- Transaction queue for blockchain operations
- Retry logic with exponential backoff

### Output Format:
Generate a high-quality architecture diagram that could be used in:
- Technical documentation
- Project presentations
- System design reviews
- Developer onboarding materials

The diagram should be comprehensive yet easy to understand, showing the complete system from user interaction to data persistence and blockchain integration.
```

---

## Additional Prompt for More Detailed Component Diagram

```
Create a detailed component-level architecture diagram specifically for the Backend Service Layer of the eKYC system, showing the internal structure and relationships.

### Focus on Backend Components:

#### 1. Request Flow Through Backend:

```
HTTP Request
    ↓
Express Router (Route Selection)
    ↓
Route Handler (auth.routes.js, kyc.routes.js, bank.routes.js)
    ↓
Middleware Chain:
  1. authenticate (JWT verification)
  2. authorize(['role']) (permission check)
  3. validate (input validation)
    ↓
Controller (kycController.js, bankController.js, authController.js)
    ↓
Service Layer:
  - kycService.js (business logic)
  - blockchainService (blockchain operations)
    ↓
Model Layer (Mongoose):
  - User.findById()
  - KycRequest.create()
  - Credential.save()
    ↓
Database (MongoDB) / Blockchain (Smart Contract)
    ↓
Response Chain (reverse flow)
    ↓
Error Handling Middleware (if error occurs)
    ↓
JSON Response to Client
```

#### 2. Blockchain Service Internal Architecture:

Show the modular structure:

```
CredentialService (main API)
    ├── Uses → BlockchainProvider (network connection)
    ├── Uses → WalletManager (wallet operations)
    ├── Uses → ContractManager (smart contract interaction)
    ├── Uses → TransactionManager (transaction execution)
    ├── Uses → EventListener (blockchain events)
    ├── Uses → TransactionQueue (priority queue)
    └── Uses → Utilities (validators, helpers, logger, errors)

Each component should show its key methods and responsibilities.
```

#### 3. Authentication Flow Detail:

```
1. User Login Request
    ↓
2. authController.login()
    ↓
3. User.findOne({ email }) → MongoDB
    ↓
4. user.comparePassword(password) → bcrypt validation
    ↓
5. Generate JWT tokens:
   - Access Token (15min, contains: id, email, role)
   - Refresh Token (7days, contains: id, type)
    ↓
6. Store refresh token in Redis (key: userId, TTL: 7days)
    ↓
7. Return { user, accessToken, refreshToken }
    ↓
8. Frontend stores in localStorage
    ↓
9. Subsequent requests include: Authorization: Bearer <accessToken>
    ↓
10. authenticate middleware verifies token
    ↓
11. authorize middleware checks user.role
    ↓
12. Request proceeds to controller
```

### Visual Requirements:
- Use UML-style boxes for classes/modules
- Show method names inside boxes
- Use composition/dependency arrows
- Color-code by responsibility (auth=blue, data=green, blockchain=orange)
- Include cardinality (1-to-1, 1-to-many relationships)
- Show async/sync operations differently
```

---

## Prompt for Workflow/Sequence Diagram

```
Create a sequence diagram showing the complete KYC workflow from customer submission to blockchain credential issuance in the eKYC system.

### Participants (from left to right):
1. Customer (Browser/Frontend)
2. Bank Officer (Browser/Frontend)
3. Backend API (Express Server)
4. MongoDB Database
5. Redis Cache
6. Blockchain Network (Ethereum)

### Sequence of Events:

**Part 1: Customer Submits KYC**
1. Customer → Frontend: Fill KYC form with NID details
2. Frontend → Backend: POST /api/v1/kyc/submit
3. Backend → Backend: Validate JWT token (check Redis)
4. Backend → Backend: Validate NID format (10/13/17 digits)
5. Backend → MongoDB: Check existing pending KYC
6. Backend → MongoDB: Create new KycRequest document
7. MongoDB → Backend: Return Request ID (KYC2412XXXXX)
8. Backend → Frontend: Return { success, requestId, status: "submitted" }
9. Frontend → Customer: Display "KYC submitted successfully"

**Part 2: Bank Officer Reviews KYC**
10. Bank Officer → Frontend: Login and navigate to KYC queue
11. Frontend → Backend: GET /api/v1/bank/kyc-requests
12. Backend → MongoDB: Find all pending KYC requests
13. MongoDB → Backend: Return list of requests
14. Backend → Frontend: Return KYC queue
15. Frontend → Bank Officer: Display pending requests
16. Bank Officer → Frontend: Click on request to review
17. Frontend → Backend: GET /api/v1/bank/kyc-request/:id
18. Backend → MongoDB: Find KycRequest by ID with documents
19. MongoDB → Backend: Return detailed KYC data
20. Backend → Frontend: Return KYC details
21. Frontend → Bank Officer: Display documents and information

**Part 3: Bank Officer Approves KYC**
22. Bank Officer → Frontend: Click "Approve" button
23. Frontend → Backend: POST /api/v1/bank/verify/:id { approved: true }
24. Backend → Backend: Verify officer has permission
25. Backend → MongoDB: Update KycRequest status to "approved"
26. Backend → MongoDB: Update User kycStatus to "approved"
27. MongoDB → Backend: Confirm update
28. Backend → Frontend: Return { success, message: "KYC approved" }
29. Frontend → Bank Officer: Display success message

**Part 4: Issue Blockchain Credential**
30. Bank Officer → Frontend: Click "Issue Credential"
31. Frontend → Backend: POST /api/v1/bank/issue-credential
32. Backend → MongoDB: Fetch approved KycRequest
33. Backend → Backend: Generate credential hash (SHA256 of KYC data)
34. Backend → Blockchain Service: Call issueCredential(holderAddress, type=2, hash)
35. Blockchain Service → Blockchain Service: Estimate gas
36. Blockchain Service → Blockchain Service: Build transaction (EIP-1559)
37. Blockchain Service → Blockchain Service: Sign with private key
38. Blockchain Service → Ethereum: Submit transaction
39. Ethereum → Ethereum: Mine transaction in block
40. Ethereum → Blockchain Service: Return transaction receipt
41. Blockchain Service → Backend: Return { txHash, blockNumber, credentialId }
42. Backend → MongoDB: Create Credential document with blockchain data
43. Backend → MongoDB: Update KycRequest with blockchain info
44. MongoDB → Backend: Confirm saved
45. Backend → Frontend: Return { success, credential, txHash, explorerUrl }
46. Frontend → Bank Officer: Display "Credential issued on blockchain"

**Part 5: Customer Views Credential**
47. Customer → Frontend: Navigate to "My Credentials"
48. Frontend → Backend: GET /api/v1/kyc/credentials
49. Backend → MongoDB: Find credentials for userId
50. MongoDB → Backend: Return credentials with txHash
51. Backend → Blockchain: Call verifyCredential(credentialId, hash)
52. Blockchain → Backend: Return { isValid: true, isRevoked: false }
53. Backend → Frontend: Return credentials with blockchain status
54. Frontend → Customer: Display credentials with verification badge

### Visual Requirements:
- Use standard UML sequence diagram notation
- Lifelines for each participant (vertical dashed lines)
- Activation boxes showing when a component is active
- Synchronous calls (solid arrows)
- Return values (dashed arrows)
- Self-calls shown as loops
- Time flows from top to bottom
- Add notes/annotations for important steps
- Group related operations with frames/boxes
- Color-code by operation type (create=green, read=blue, update=orange, blockchain=red)

### Alternative Representation:
If sequence diagram is too complex, create a simplified workflow diagram with:
- Swimlanes for each participant
- Process boxes for each step
- Decision diamonds for conditions
- Data flow arrows between steps
- Clear start and end points
```

---

## Copy-Paste Ready Prompt (Simplified Version)

```
Create a professional system architecture diagram for an eKYC Blockchain application with these components:

FRONTEND (React + TypeScript):
- Customer Dashboard
- Bank Officer Dashboard
- Authentication Pages
→ Connects to Backend via REST API (port 3000 → 5000)

BACKEND (Node.js + Express):
- API Routes: /auth, /kyc, /bank, /consent
- Middleware: JWT auth, validation, rate limiting, security
- Services: KYC service, Blockchain service
- Models: User, KycRequest, Bank, Credential
→ Connects to MongoDB (port 27017)
→ Connects to Redis (port 6379)
→ Connects to Blockchain (port 8545)

DATABASES (Docker):
- MongoDB: stores users, KYC requests, credentials
- Redis: caches sessions, rate limits
- Management UIs on ports 8081, 8082

BLOCKCHAIN (Ethereum):
- Hardhat local network or Sepolia testnet
- Smart Contract: CredentialRegistry.sol
- Functions: issueCredential, verifyCredential, revokeCredential

WORKFLOW:
1. Customer submits KYC → stored in MongoDB
2. Bank officer reviews → approves/rejects
3. If approved → credential issued on blockchain
4. Customer retrieves credential with blockchain verification

Use colors, arrows showing data flow, port numbers, and icons. Make it presentation-ready.
```

---

## Tips for Best Results with Gemini:

1. **Start with the simplified prompt** if you want a quick overview diagram
2. **Use the detailed prompt** for comprehensive technical documentation
3. **Use the sequence diagram prompt** for workflow understanding
4. **Combine prompts** by saying "First create the architecture diagram, then create a sequence diagram for the KYC workflow"
5. **Ask for iterations**: "Make the blockchain layer more prominent" or "Add more detail to the middleware"
6. **Request specific formats**: "Create this as a Mermaid diagram", "Make it in PlantUML format", or "Generate as SVG"
7. **Specify the style**: "Make it look like AWS architecture diagrams" or "Use Google Cloud architecture style"

Copy any of these prompts and paste them directly into Gemini for diagram generation!
