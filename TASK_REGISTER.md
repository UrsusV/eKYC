# eKYC task register

Update this file in the same commit (or session) as the work it describes. Status: `pending` | `in_progress` | `done` | `blocked`.

| ID | Status | Summary | Primary files / areas | Notes |
|----|--------|---------|----------------------|-------|
| `context-files` | done | Repo plan + task register for multi-chat context | `PLAN.md`, `TASK_REGISTER.md` | Created initial versions |
| `docker-stack` | pending | Node 20 Dockerfiles + full Compose (Hardhat, deploy, backend, frontend) | `docker-compose.yml`, `backend/`, `frontend/`, `blockchain/`, `README.md`, `hardhat.config.js` | See PLAN.md § Local Docker stack |
| `correctness-bugs` | pending | nidData schema, revocation fix, credential authz, id lookup, submitted filter, refresh token, upload step | `KycRequest.js`, `kycService.js`, `credentialController.js`, `bankValidators.js`, `apiClient.ts`, `SubmitKycPage.tsx` | Before paper-alignment crypto |
| `encryption-and-hash` | pending | Encrypt PII at rest; `H(D_i ∥ η)` with encrypted η | `ENCRYPTION_KEY` helper, `User`, `KycRequest`, `bankController.js`, `Document.js` | Remove or fix fake `encryptMetadata` |
| `contract-id` | pending | Unique credential ids, zero-address check, consent storage on-chain | `CredentialRegistry.sol`, deploy scripts | Redeploy via Compose `deploy` |
| `issuance-saga` | pending | Idempotent issuance, issuanceStatus, per-bank scope, hash verify on read | `bankController.js`, new issuance service, `KycRequest`, `TransactionQueue.js`, `server.js` | Single path for verify + manual issue |
| `per-bank-keys` | pending | One signer per bank for issue/revoke | `CredentialService.js`, `Bank.js`, env/secrets | Not single `BLOCKCHAIN_PRIVATE_KEY` |
| `consent-and-docs` | pending | Custodial holder key, explicit on-chain consent, delete docs after first issuance | `authController.js`, `consentController.js`, `kycController.js`, Document upload/delete | No auto-grant on share |
| `throughput` | pending | Async chain confirm, init at startup, dashboard parallel fetch, Redis or disconnect | `server.js`, `DashboardPage.tsx`, `auth.js`, Redis usage | Queue concurrency 1 per wallet |
| `paper-sepolia-wording` | pending | Align abstract, contribution, §5.1 with local Hardhat; fix Redis/shard claims | External: `Final_Version_KYC-2 (Final)/wileyNJDv5_AMA.tex` | No Sepolia deploy to satisfy old text |

## Session log

| Date | Actor | Change |
|------|-------|--------|
| 2026-11-13 | Agent | Created `PLAN.md`, `TASK_REGISTER.md`; marked `context-files` done |

## How to use in a new chat

1. Read [PLAN.md](PLAN.md) for scope and order.
2. Read this table; pick the first `pending` item in implementation order (or continue `in_progress`).
3. Set row to `in_progress` when starting; set `done` with a one-line note when finished.
4. Append a row to **Session log**.
