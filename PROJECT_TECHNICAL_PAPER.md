# eKYC Platform - Comprehensive Technical Paper

## 1) Executive Overview

This repository implements a full-stack electronic Know Your Customer (eKYC) platform that combines:

- A **role-based web application** for customers and bank officers.
- A **backend workflow engine** for KYC submission, review, credential issuance, and consent tracking.
- A **blockchain-backed credential registry** for issuance, verification, and revocation transparency.

At a systems level, the project follows a hybrid trust model:

- **Off-chain state** in MongoDB stores user profiles, KYC requests, consent records, and operational audit data.
- **On-chain state/events** in `CredentialRegistry.sol` establish tamper-evident lifecycle operations for credentials.

This architecture is appropriate for regulated verification domains where privacy, auditability, and controlled sharing must coexist.

---

## 2) Repository Topology and System Boundaries

Root folder:

- `README.md` - top-level architecture, run instructions, and API summary.
- `docker-compose.yml` - local infrastructure (MongoDB, Redis, admin tools).
- `start-all.sh` - startup orchestration guidance.
- `backend/` - Express API, domain services, persistence, blockchain bridge.
- `frontend/` - React/Vite TypeScript SPA.
- `blockchain/` - Hardhat project, Solidity contract, deployment scripts/tests.
- `scripts/` - root-level utility/demo orchestration.
- `files/` - legacy/reference bundle (contains non-canonical artifacts and templates).

System boundary:

- **Frontend boundary:** user interaction and API consumption.
- **Backend boundary:** source of truth for domain validation and authorization.
- **Blockchain boundary:** immutable credential lifecycle signals (issue/revoke/verify basis).

---

## 3) Methodological Approach

The implementation reflects a practical multi-layer methodology:

## 3.1 Layered Service Design

Backend progression:

- Route -> Controller -> Service -> Model -> External subsystem (blockchain).
- Clear separation of request/response concerns (controllers) and domain transitions (services).

Primary files:

- App/server composition: `backend/src/app.js`, `backend/src/server.js`
- Domain service: `backend/src/services/kycService.js`
- Blockchain orchestration: `backend/src/services/blockchain/CredentialService.js`

## 3.2 Stateful Workflow Modeling

KYC is modeled as a controlled status transition process with validation and history:

- Transition guard logic lives in `backend/src/services/kycService.js` (`STATUS_TRANSITIONS`, `validateStatusTransition`).
- Persistence of timeline/history is in `backend/src/models/KycRequest.js`.

This provides deterministic process behavior and traceability.

## 3.3 Hybrid On-chain/Off-chain Integrity Pattern

Credential details and UX metadata remain off-chain while hash-linked lifecycle actions are pushed on-chain.

Benefits:

- Reduces blockchain storage costs.
- Protects sensitive personal content.
- Preserves verifiability and revocation transparency.

Implementation points:

- Hash generation + issue calls: `backend/src/controllers/bankController.js`
- Contract methods: `blockchain/contracts/CredentialRegistry.sol`

## 3.4 Defense-in-Depth API Security

Security middleware stack in `backend/src/app.js` combines:

- `helmet`, CORS policy, rate limiting.
- NoSQL injection sanitization and XSS sanitization.
- HTTP parameter pollution protection.

Role/token enforcement in `backend/src/middleware/auth.js` provides JWT authentication and role-based authorization.

---

## 4) Full Architecture Analysis

## 4.1 Frontend Architecture

Core bootstrap:

- `frontend/src/main.tsx`:
  - Creates React Query client.
  - Wraps app with `BrowserRouter`, `QueryClientProvider`, `ToastProvider`, `AuthProvider`.

Routing and role gates:

- `frontend/src/App.tsx`
  - Public routes (`/login`, registration).
  - Protected customer routes (`/kyc/*`, `/credentials`, `/consents`).
  - Protected officer routes (`/officer/*`).
  - Role-based redirect via `DashboardRedirect`.
- `frontend/src/components/PrivateRoute.tsx` enforces `allowedRoles`.

Global state:

- `frontend/src/contexts/AuthContext.tsx` - authentication lifecycle and user state.
- `frontend/src/contexts/ToastContext.tsx` - centralized notification bus.

API abstraction:

- `frontend/src/services/apiClient.ts`
  - Axios client.
  - Access token injection.
  - Refresh-token-on-401 retry strategy.
  - Local storage token/user persistence.

Business service modules:

- `frontend/src/services/authService.ts`
- `frontend/src/services/kycService.ts`
- `frontend/src/services/bankService.ts`
- `frontend/src/services/consentService.ts`

Observations:

- React Query provider is configured but most pages use manual `useEffect + useState` fetch patterns.
- Response shape handling is defensive, indicating inconsistent backend payload wrappers across endpoints.

## 4.2 Backend Architecture

Runtime and app assembly:

- `backend/src/server.js`:
  - Loads env.
  - Connects MongoDB and Redis.
  - Starts Express server.
  - Handles graceful shutdown.
- `backend/src/app.js`:
  - Security middleware.
  - Route mounts for `/auth`, `/kyc`, `/bank`, `/consent`, `/credentials`.
  - Error handling and fallback middleware.

Routing modules:

- `backend/src/routes/auth.routes.js`
- `backend/src/routes/kyc.routes.js`
- `backend/src/routes/bank.routes.js`
- `backend/src/routes/consent.routes.js`
- `backend/src/routes/credential.routes.js`

Controllers:

- `backend/src/controllers/authController.js`
- `backend/src/controllers/kycController.js`
- `backend/src/controllers/bankController.js`
- `backend/src/controllers/consentController.js`
- `backend/src/controllers/credentialController.js`

Domain services:

- `backend/src/services/kycService.js` - KYC transitions/business checks.
- `backend/src/services/blockchain/*` - blockchain transport and orchestration.

Models:

- `backend/src/models/User.js`
- `backend/src/models/Bank.js`
- `backend/src/models/KycRequest.js`
- `backend/src/models/Credential.js`
- `backend/src/models/Consent.js`
- `backend/src/models/Document.js`
- `backend/src/models/AuditLog.js`

Validation:

- Joi and express-validator schemas in `backend/src/validators/*`.

## 4.3 Blockchain Architecture

Contract:

- `blockchain/contracts/CredentialRegistry.sol`
  - Authorized issuer administration.
  - Credential issuance/revocation/verification.
  - Consent event emission.

Hardhat stack:

- `blockchain/hardhat.config.js`
- `blockchain/scripts/deploy.js`
- `blockchain/scripts/setup-issuers.js`
- `blockchain/scripts/full-setup.js`
- `blockchain/deployments/*.json`

Backend bridge:

- `backend/src/services/blockchain/CredentialService.js`
- `backend/src/services/blockchain/core/BlockchainProvider.js`
- `backend/src/services/blockchain/managers/ContractManager.js`
- `backend/src/services/blockchain/managers/TransactionManager.js`
- `backend/src/services/blockchain/managers/WalletManager.js`
- `backend/src/services/blockchain/managers/TransactionQueue.js`
- `backend/src/services/blockchain/managers/EventListener.js`
- `backend/src/services/blockchain/index.js` (`getCredentialService` singleton)

---

## 5) End-to-End Domain Workflows

## 5.1 Customer KYC Submission

Primary frontend source:

- `frontend/src/pages/SubmitKycPage.tsx`

Flow:

1. Customer fills wizard (traditional KYC) or shared-credential path.
2. `kycService.submitKyc()` calls `POST /kyc/submit`.
3. Backend route `backend/src/routes/kyc.routes.js` applies auth/role checks.
4. `backend/src/controllers/kycController.js` validates and routes to service path.
5. `createKYCRequest()` in `backend/src/services/kycService.js` performs:
   - NID validation.
   - Bank/user existence checks.
   - duplicate pending request prevention.
6. `KycRequest` persisted and `User.kycStatus` updated.

## 5.2 Officer Review and Approval/Rejection

Frontend review pages:

- Queue: `frontend/src/pages/KycQueuePage.tsx`
- Review: `frontend/src/pages/ReviewKycPage.tsx`

Backend processing:

- Endpoint: `POST /bank/verify/:requestId`
- Controller: `backend/src/controllers/bankController.js` (`verifyKycRequest`)
- Domain status update: `updateKYCStatus()` in `backend/src/services/kycService.js`

## 5.3 Credential Issuance (Auto/Manual)

Auto issuance path:

- Approval flow in `verifyKycRequest` can trigger blockchain issuance.

Manual issuance path:

- Endpoint: `POST /bank/issue-credential`
- Controller method: `issueCredential` in `backend/src/controllers/bankController.js`

Technical sequence:

1. Backend computes hash from selected KYC fields.
2. Calls `credentialService.issueCredential(...)`.
3. Blockchain transaction executed via manager stack.
4. DB writes:
   - `Credential` record with tx metadata.
   - `KycRequest.blockchain` update with issuance info.

## 5.4 Credential Revocation and Status Check

- Revocation endpoint: `POST /credentials/:credentialId/revoke`
- Status endpoint: `GET /credentials/:credentialId/revocation-status`
- Controller: `backend/src/controllers/credentialController.js`

On revocation:

- Calls chain `revokeCredential`.
- Updates off-chain `Credential` status and revocation metadata.

## 5.5 Consent Lifecycle

Frontend:

- `frontend/src/pages/ConsentsPage.tsx`

Backend:

- Controller methods in `backend/src/controllers/consentController.js`:
  - `createConsent`, `grantConsent`, `denyConsent`, `revokeConsent`, `bulkGrantConsents`
- Model semantics in `backend/src/models/Consent.js`:
  - `grant`, `deny`, `revoke`, `hasValidConsent`, `getValidConsents`

This enables selective sharing and retrieval permissions for credential usage.

---

## 6) Critical Functions and Symbols (High-Value Index)

This section catalogs the most consequential functions by subsystem.

## 6.1 Backend Core

- `startServer` - `backend/src/server.js`
- App composition/middleware mount - `backend/src/app.js`

## 6.2 Auth and Access Control

- `registerCustomer` - `backend/src/controllers/authController.js`
- `registerBankOfficer` - `backend/src/controllers/authController.js`
- `login`, `refreshToken` - `backend/src/controllers/authController.js`
- `authenticate`, `authorize`, `optionalAuth`, `checkPermissions` - `backend/src/middleware/auth.js`

## 6.3 KYC Domain Engine

- `submitKycRequest`, `getKycStatus`, `getKycHistory`, `getCredentials` - `backend/src/controllers/kycController.js`
- `createKYCRequest`, `updateKYCStatus`, `validateStatusTransition`, `verifyNIDFormat` - `backend/src/services/kycService.js`

## 6.4 Bank Officer Operational Functions

- `getKycRequests`, `getKycRequestDetails`, `verifyKycRequest`, `issueCredential`, `getIssuedCredentials` - `backend/src/controllers/bankController.js`

## 6.5 Credential Governance

- `revokeCredential`, `getRevocationStatus`, `getCredentialDetails` - `backend/src/controllers/credentialController.js`
- `revoke`, `grantAccess`, `recordVerification`, `recordAccess` - `backend/src/models/Credential.js`

## 6.6 Blockchain Orchestration

- `initialize`, `issueCredential`, `verifyCredential`, `getCredential`, `revokeCredential`, `grantConsent`, `getHealthStatus` - `backend/src/services/blockchain/CredentialService.js`
- `connect`, `waitForTransaction`, `healthCheck` - `backend/src/services/blockchain/core/BlockchainProvider.js`
- `executeContractMethod`, `sendTransaction`, `waitForConfirmation` - `backend/src/services/blockchain/managers/TransactionManager.js`
- `execute`, `call`, `send`, `loadContractFromArtifact` - `backend/src/services/blockchain/managers/ContractManager.js`
- `startListening`, `queryEvents`, `watchEvent` - `backend/src/services/blockchain/managers/EventListener.js`

## 6.7 Smart Contract Methods

From `blockchain/contracts/CredentialRegistry.sol`:

- `addAuthorizedIssuer`
- `issueCredential`
- `verifyCredential`
- `revokeCredential`
- `grantConsent`
- `getCredential`
- `getHolderCredentials`

Events:

- `CredentialIssued`
- `CredentialRevoked`
- `ConsentGranted`

---

## 7) Data Model and Persistence Semantics

## 7.1 Core Entity Roles

- `User` - identity, auth state, role (`customer`, `bank_officer`, `admin`), account lock behavior.
- `Bank` - bank profile and active status.
- `KycRequest` - workflow status, review metadata, blockchain issuance linkage.
- `Credential` - issued credential metadata, on-chain references, revocation/audit.
- `Consent` - sharing approvals and temporal validity.
- `AuditLog` - explicit operational logging structure.
- `Document` - file/document metadata with optional blockchain marker fields.

## 7.2 Dual-State Credential Record

Credential records in `backend/src/models/Credential.js` include blockchain metadata:

- `transactionHash`
- `blockNumber`
- `holderAddress`
- `issuerAddress`
- `blockchainCredentialId`
- `networkId`
- `gasUsed`

This allows frontend and auditors to inspect both process-level and chain-level outcomes.

---

## 8) API Surface and Integration Contracts

Primary route groups (all in `backend/src/routes/`):

- `auth.routes.js`
- `kyc.routes.js`
- `bank.routes.js`
- `consent.routes.js`
- `credential.routes.js`

Frontend API call sites (all in `frontend/src/services/`):

- `authService.ts`
- `kycService.ts`
- `bankService.ts`
- `consentService.ts`
- `apiClient.ts`

Key integration properties:

- JWT-based bearer auth across protected routes.
- Automatic token refresh on first 401 in client interceptor.
- Role-gated route usage on both frontend (routing) and backend (middleware).

---

## 9) Security Engineering Posture

## 9.1 Implemented Controls

- API header hardening with `helmet`.
- CORS policy controls.
- Global and route-specific rate limiting.
- Sanitization against NoSQL/operator injection and basic XSS payloads.
- HPP prevention.
- Password hashing and login lockout behavior in `User` model.
- RBAC through `authorize(...)`.

## 9.2 Important Security-Relevant Design Choices

- KYC and consent are controlled off-chain to preserve privacy and flexibility.
- Blockchain stores cryptographic references and lifecycle events, not raw personal data.
- Credential access logic includes issuer/consent checks in controller-level logic.

---

## 10) Build, Configuration, and Runtime Operations

## 10.1 Backend Runtime Contracts

Critical env classes in `backend/.env.example`:

- Database: `MONGODB_URI`
- Cache/infra: `REDIS_URL`
- Auth: `JWT_SECRET`, `JWT_REFRESH_SECRET`, expiries
- Security/rate-limit/cors fields
- Blockchain: network, RPC, contract address, private key fields

## 10.2 Frontend Runtime Contracts

In `frontend/src/vite-env.d.ts` and service usage:

- `VITE_API_BASE_URL`
- app display metadata variables

Build config:

- `frontend/vite.config.ts` (port/proxy/chunking/minification)
- `frontend/tsconfig.json` strict settings
- `frontend/tailwind.config.js` design tokens

## 10.3 Blockchain Runtime Contracts

- `blockchain/.env.example`
- `blockchain/hardhat.config.js` network wiring
- deployment outputs in `blockchain/deployments/`

---

## 11) Testing Strategy and Quality Coverage

## 11.1 Backend Testing

Framework:

- Jest + Supertest + mongodb-memory-server

Representative suites:

- API integration: `backend/src/tests/api/integration.test.js`
- Journey flow: `backend/src/tests/api/completeJourney.test.js`
- Controllers: `backend/src/controllers/__tests__/*`
- Services: `backend/src/services/__tests__/kycService.test.js`
- Middleware/models/validators: relevant `__tests__` folders
- Blockchain service tests: `backend/src/services/blockchain/__tests__/*`

Config:

- `backend/jest.config.js`
- setup files in backend test directories.

## 11.2 Smart Contract Testing

- `blockchain/test/CredentialRegistry.test.js`

Includes deployment, authorization, issuance, verification, revocation, consent, and gas-related behavior tests.

## 11.3 Frontend Testing Status

- No dedicated frontend test suite is currently evident in `frontend/` (`*.test*`/`*.spec*` absent).
- Lint and type-check scripts exist in frontend package configuration.

---

## 12) Important Risks, Gaps, and Technical Debt

This section highlights high-impact findings that are crucial for maintainers.

## 12.1 Backend/Blockchain Logic Risks

- In `backend/src/controllers/credentialController.js`, `getRevocationStatus` references `credentialService` without local initialization in that function path.
- In the same controller, inconsistent identity resolution appears between Mongo `_id` lookups and business `credentialId` semantics across endpoints.
- Potential bank association field mismatch (`user.bankId` vs nested officer bank field usage in schema) can affect authorization outcomes.

## 12.2 Configuration Drift Risks

- Env naming appears inconsistent across runtime/docs/scripts for blockchain private key and provider URL fields.
- Base URL defaults and dev proxy ports can diverge (`frontend/src/services/apiClient.ts` vs `frontend/vite.config.ts`), creating integration confusion.

## 12.3 Frontend Contract Drift Risks

- Several pages include defensive response parsing, implying non-uniform backend response shape contracts.
- `CredentialDetailPage` route exists but appears not fully implemented.
- Some page-level type assumptions may not exactly match backend payload fields.

## 12.4 Repo Hygiene Risks

- `files/` contains legacy/reference materials and inactive CI templates that can mislead onboarding.
- Deleted docs in current git state suggest documentation consolidation is still in transition.

---

## 13) Crucial Files by Responsibility (Quick Lookup)

## 13.1 System Entry and Infrastructure

- `README.md`
- `docker-compose.yml`
- `start-all.sh`

## 13.2 Backend Critical Path

- `backend/src/server.js`
- `backend/src/app.js`
- `backend/src/controllers/bankController.js`
- `backend/src/controllers/kycController.js`
- `backend/src/controllers/credentialController.js`
- `backend/src/services/kycService.js`
- `backend/src/services/blockchain/CredentialService.js`
- `backend/src/models/KycRequest.js`
- `backend/src/models/Credential.js`
- `backend/src/middleware/auth.js`

## 13.3 Frontend Critical Path

- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/services/apiClient.ts`
- `frontend/src/pages/SubmitKycPage.tsx`
- `frontend/src/pages/ReviewKycPage.tsx`
- `frontend/src/pages/ConsentsPage.tsx`

## 13.4 Blockchain Critical Path

- `blockchain/contracts/CredentialRegistry.sol`
- `blockchain/hardhat.config.js`
- `blockchain/scripts/deploy.js`
- `blockchain/scripts/setup-issuers.js`
- `blockchain/test/CredentialRegistry.test.js`
- `blockchain/deployments/localhost-deployment.json`

---

## 14) Architectural Strengths

- Strong role-aware separation between customer and officer workflows.
- Clear layered backend with identifiable domain and integration boundaries.
- Practical hybrid chain/off-chain credential lifecycle architecture.
- Broad backend and blockchain test coverage footprint.
- Useful operational scripts for setup and demos.

---

## 15) Recommended Next Evolution (Priority Ordered)

1. Normalize API response envelope formats and enforce contract typing across frontend services.
2. Fix credential identifier consistency and revocation-status controller initialization bug.
3. Standardize blockchain env variable names and startup scripts to one canonical contract.
4. Add frontend test suite (component + integration) for critical KYC/consent/credential journeys.
5. Convert legacy docs in `files/` into a versioned `/docs` structure and remove stale duplicates.
6. Introduce formal CI workflows in `.github/workflows/` for lint/typecheck/test/deploy gates.

---

## 16) Conclusion

The project is a strong full-stack capstone-grade implementation of an eKYC system with meaningful real-world architecture decisions: strict role pathways, workflow-state discipline, and blockchain-backed credential governance. The core foundations are already robust enough for advanced demo and research settings. The highest-impact next steps are integration contract hardening, consistency fixes in credential/revocation logic, frontend test expansion, and documentation/ops standardization.

With these refinements, the repository can move from strong prototype posture toward production-readiness and easier long-term maintainability.

