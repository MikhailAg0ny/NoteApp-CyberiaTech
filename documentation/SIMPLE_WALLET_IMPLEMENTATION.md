# Simple Wallet Implementation Checklist

This document distills the steps from `SIMPLE_WALLET_PLAN.md` into a concise, execution-ready checklist for both the backend and frontend repos.

> ⚠️ **Reminder:** The mnemonic remains in `localStorage`. Treat this workflow as **testnet-only** and non-production.

---

## Task Tracker (tie-in with `STEP_BY_STEP.md`)

| # | Area | Task | Owner | Status |
| --- | --- | --- | --- | --- |
| 1 | DB | Ensure `users.cardano_address` exists (see Step 1 in `STEP_BY_STEP.md`). | Backend | ☐ |
| 2 | Auth | Accept & validate `cardano_address` on `/api/auth/register`. | Backend | ☐ |
| 3 | Proxy | Re-test `/api/wallet/balance` + `/api/wallet/submit` with Blockfrost creds. | Backend | ☐ |
| 4 | Registration | Generate wallet client-side, stash mnemonic in `localStorage`, send address to backend. | Frontend | ☐ |
| 5 | Context/UI | Detect browser mnemonic, surface manual panel, relay CBOR. | Frontend | ☐ |
| 6 | Docs | Add warnings + demo script references to READMEs. | Shared | ☐ |

Mark each box as you proceed so graders can tell which portion of the simplified plan has been executed.

---

## Backend (Express + Postgres)

1. **Schema verification**
   - Ensure the `users` table has a `cardano_address` column (unique). If not, run an `ALTER TABLE` migration.
2. **Registration controller**
   - Update `controllers/authController.js` so `/api/auth/register` accepts `cardano_address`.
   - Validate the string (non-empty, `addr_test...` prefix) and persist it alongside the password hash.
3. **Wallet proxy readiness**
   - Double-check `.env` contains `CARDANO_NETWORK=preprod`, `BLOCKFROST_API_URL`, and `BLOCKFROST_API_KEY`.
   - Smoke-test `POST /api/wallet/balance` and `POST /api/wallet/submit` with a sample JWT + address to confirm Blockfrost connectivity.
4. **Docs**
   - Note the insecurity + testnet scope in `backend/README.md` so graders see the disclaimer.

### Backend Step-by-Step
1. Open `migrations/` and confirm `2024-11-18_add_user_wallet_columns.sql` (or equivalent) includes `cardano_address`. If not, craft a new migration with `ALTER TABLE users ADD COLUMN cardano_address VARCHAR(255) UNIQUE;`.
2. In `controllers/authController.js`, extend the register handler:
   1. Extract `cardano_address` from `req.body`.
   2. Validate with a simple regex like `/^addr_test/`.
   3. Persist the value in the `INSERT` statement.
3. Run `npm run dev` (or `npm start`) in `backend/` and hit the updated register route via Postman or the frontend to ensure the DB row now holds the address.
4. With a valid JWT, curl the wallet proxy endpoints to ensure Blockfrost credentials work:
   ```powershell
   curl -X POST http://localhost:5000/api/wallet/balance -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"address":"addr_test1..."}'
   ```
5. Document the security warning in `backend/README.md` (copy the ⚠️ note above).

---

## Frontend (Next.js)

1. **Registration flow (`src/app/register/page.tsx`)**
   - On submit: generate entropy via `@emurgo/cardano-serialization-lib-asmjs`, derive a testnet address, and stash the mnemonic in `localStorage` (e.g., `user_mnemonic`).
   - Send the bech32 `cardano_address` to the backend register endpoint and surface a toast warning that the seed only lives in this browser.
2. **Wallet context (`src/app/contexts/WalletContext.tsx`)**
   - Add helpers to detect/load the mnemonic from storage and derive the same address for client display.
   - Expose flags like `hasBrowserMnemonic` so UI components know whether to show manual actions.
3. **Manual wallet UI (`ManualWalletPanel.tsx`)**
   - Autoload the saved `cardano_address` for the logged-in user.
   - Provide actions to rebuild a signed transaction using the mnemonic or accept a pre-signed CBOR payload, then send it through `/api/wallet/submit`.
4. **Notes page integration (`src/app/page.tsx`)**
   - Keep CIP-30-specific prompts hidden unless a browser wallet is actually connected.
   - Highlight the manual workflow as the default path and show status badges for mnemonic presence.
5. **Copy & warnings**
   - Repeat “Testnet only. Mnemonic stored in this browser.” anywhere the wallet is referenced (registration success, manual panel, tooltips).

### Frontend Step-by-Step
1. **Registration** (`src/app/register/page.tsx`)
   1. Import `@emurgo/cardano-serialization-lib-asmjs`.
   2. On form submit: generate entropy → mnemonic → derive testnet address → `localStorage.setItem("user_mnemonic", mnemonicPhrase)`.
   3. POST `{ email, password, cardano_address }` to `/api/auth/register`.
   4. Show a toast summarizing where the mnemonic lives.
2. **Wallet context**
   1. In `WalletContext.tsx`, add `const mnemonic = typeof window !== "undefined" ? localStorage.getItem("user_mnemonic") : null;`.
   2. If `mnemonic` exists, derive the address and set `linkedWallet` so the UI reflects it even without CIP-30.
3. **Manual panel**
   1. Autofill `cardano_address` from the authenticated user record.
   2. Add buttons for **Load mnemonic from browser** and **Build & Sign**.
   3. When the user submits, call `relaySignedTransaction` (already exposed in `WalletContext`).
4. **Notes page**
   1. Remove residual “connect wallet” prompts (done earlier).
   2. Display badges like “Mnemonic detected” vs. “Missing mnemonic – re-register on this device.”
5. **Copy pass**
   - Search for “Wallet” or “ADA” and ensure each spot mentions the testnet-only limitation.

---

## Test / Demo Script

1. Register a new user → confirm `cardano_address` is saved server-side and `user_mnemonic` exists in DevTools storage.
2. Visit My Notes → ensure the manual panel reflects the stored address and shows a “mnemonic detected” indicator.
3. Paste or build a signed CBOR payload → submit via the manual panel → capture the returned Blockfrost hash for the presentation.
4. (Optional) Use `/api/wallet/balance` to prove the backend can fetch UTxOs for the linked address.

---

## Risk Callouts

- Anyone with access to the browser can drain the wallet. Make this explicit in every demo.
- Mnemonic loss = wallet loss. Offer a “Download mnemonic” or “Re-register on this device” reminder if time allows.
- Blockfrost rate limits still apply; cache balance responses where possible during demos.
