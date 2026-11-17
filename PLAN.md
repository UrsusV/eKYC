# eKYC robustness and efficiency plan

**Source of truth for multi-session work.** Update this file when decisions change. Track execution in [TASK_REGISTER.md](TASK_REGISTER.md).

## Overview

The prototype’s happy path works, but several bugs drop identity data and desync Mongo from the chain. The paper’s privacy claims (encryption at rest, salted hashes, per-bank signatures, holder-signed consent, document deletion, authorized verifiers) are not what this repo does. This pass implements those missing controls in the codebase. The paper stays unchanged: no wording edits, and no Sepolia deploy to match the existing text.

**First execution steps:** context files (this document + task register), then a Node 20 Compose stack so Mongo, Redis, Hardhat, backend, and frontend run without a host Node install.

## Architecture (current)

| Tier | Path | Role |
|------|------|------|
| Frontend | `frontend/src` | React + Vite, port 3000 |
| Backend | `backend/src` | Express + Mongo, port 5000 |
| Chain | `blockchain/contracts/CredentialRegistry.sol` | Single registry contract |
| Data | Docker: MongoDB 7, Redis 7 | Redis connected but unused in app logic |

```mermaid
sequenceDiagram
  participant UI as React
  participant API as Express
  participant KYC as kycService
  participant DB as Mongo
  participant Chain as CredentialRegistry

  UI->>API: POST /kyc/submit
  API->>KYC: createKYCRequest
  KYC->>DB: status submitted
  Note over KYC,DB: nidData stripped; PII plaintext
  UI->>API: POST /bank/verify approved
  API->>Chain: shared key, unsalted SHA-256, sync wait
  API->>DB: Credential.create
  Note over API,Chain: consent in Mongo only
```

**Solid today:** role-gated routes, Joi on writes, `kycService` status machine, indexes, security middleware, layered blockchain client + tests, centralized `apiClient` with 401 retry.

## Paper vs prototype gaps

| Claim | Paper | Prototype |
|-------|--------|-----------|
| Encryption at rest | Section 4, Table 3, §7.3 | `encryptMetadata` only sets IV; `ENCRYPTION_KEY` unused; PII plaintext |
| Credential hash | `C_i = H(D_i ∥ η)` | Unsalted `SHA-256(JSON.stringify(...))` in `bankController.js` |
| Per-bank signing | Each bank signs own txs (§7.5) | Single `BLOCKCHAIN_PRIVATE_KEY` |
| On-chain consent | Holder-signed, time-bound (BAN M2) | Key discarded at register; auto-granted Mongo consent |
| Document deletion | After first issuance (§4, Table 3, §7.3, conclusion) | Upload UI not wired; no delete path |
| Verifier | Authorized verifier, read-only | No `verifier` role; public chain reads |
| Evaluation network | Abstract, §5.1 say Sepolia | Local Hardhat only; §6 / future work say Hardhat |

## Workstreams

### A. Context and Docker (steps 1–2)

See [Local Docker stack](#local-docker-stack) below. README quick start: `docker compose up --build` → ports 3000, 5000, 8081, 8082.

### B. Correctness bugs (step 3)

- Persist `submissionDetails.nidData` + `nidFormat` on `KycRequest` schema.
- Fix `getRevocationStatus`: `getCredentialService()` + `bankOfficerInfo.bankId`.
- Credential details: issuer-or-consent authz (same as revocation).
- Unify credential id resolver (business `credentialId` vs Mongo `_id`).
- Contract: unique credential id, nonce, no zero holder (step 5).
- Bank list validator: allow `submitted`.
- Frontend: persist rotated refresh token; single-flight refresh.
- Submit KYC: stop requiring images until upload API exists (or wire upload).

### C. Encryption and hash (step 4)

- AES-256-GCM helper with `ENCRYPTION_KEY`; encrypt PII payloads; keyed HMAC for NID lookup.
- `H(canonical D_i ∥ η)`; store η encrypted off-chain; canonical field order.

### D. Contract and consent storage (step 5)

- Store consent `(verifier, expiry, active)` on-chain, not event-only.
- Redeploy via Compose `deploy` service.

### E. Issuance saga (step 6)

- `issuanceStatus`: `not_started | pending | issued | failed`.
- Pending record before tx; idempotent retry; one issuance function; per `(userId, bankId)` credential scope.
- Partial unique index on in-progress KYC per user+bank.
- `CredentialService` init at `server.js` startup.
- Async confirmation, queue `MAX_CONCURRENT: 1` per wallet.
- Verify reads: `verifyCredential` + hash match; no writes on GET.

### F. Per-bank keys (step 6)

- Signer per bank; authorize on-chain; revoke with original issuer key.

### G. Consent and documents (step 7)

- Encrypted custodial holder key at registration.
- Consent pending → explicit grant → chain sign; no auto-grant on credential sharing.
- Upload, encrypt, delete file bytes after first successful issuance.

### H. Throughput (with F/G)

- Dashboard `Promise.all`; officer counts endpoint; server-side search; auth middleware without `+password`; Redis for refresh denylist or disconnect.

## Local Docker stack

**Current:** `docker-compose.yml` = Mongo, Redis, admin UIs only. No app Dockerfiles. `start-all.sh` needs host Node.

**Target services:** `mongodb`, `redis`, `mongo-express`, `redis-commander`, `hardhat`, `deploy` (one-shot), `backend`, `frontend`.

**Wiring notes:**

- Deploy container uses `HARDHAT_RPC_URL=http://hardhat:8545` (not `127.0.0.1` inside sibling container). Add env override in `hardhat.config.js`.
- Backend: `BLOCKCHAIN_RPC_URL=http://hardhat:8545`, Mongo/Redis hostnames, `CORS_ORIGIN=http://localhost:3000`.
- `CONTRACT_ADDRESS` from shared `deployments/localhost-deployment.json` via backend entrypoint.
- One-shot: `deploy.js` + `authorize-hardhat-account.js`.
- Mount `blockchain/artifacts` for `CredentialService` ABI path; named volumes for artifacts/deployments and DB.
- Frontend: `npm run dev -- --host 0.0.0.0`; API URL `http://localhost:5000/api/v1` for browser on host.
- Tests: `docker compose run --rm backend npm test`.
- `docker compose down -v` wipes DB + chain deployment volumes. Recreating `hardhat` requires re-run `deploy`.

## Implementation order

1. `PLAN.md` + `TASK_REGISTER.md` (maintain register per change).
2. Node 20 Dockerfiles + extended Compose + README.
3. Correctness bugs (section B).
4. Encryption + salted hash (section C).
5. Contract ids + on-chain consent (section D).
6. Issuance saga + per-bank keys (sections E–F).
7. Holder key, consent flow, document deletion (section G).
8. Throughput items (section H) as touched.

## Deferred (not this pass)

Public bank-officer registration; unused `checkPermissions`; `AuditLog`; admin issuer removal/override; permissioned chain; HttpOnly cookies; global `errorHandler` refactor; React Query. Paper text (Sepolia, Redis, sharding) is out of scope; do not edit the paper.

## References

- Paper: `/home/ursusv18/Projects/Final_Version_KYC-2 (Final)/wileyNJDv5_AMA.tex`
- Cursor working copy: `~/.cursor/plans/ekyc_robustness_review_c8441388.plan.md` (optional mirror)
