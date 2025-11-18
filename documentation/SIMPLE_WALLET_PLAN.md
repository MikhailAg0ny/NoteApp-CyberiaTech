# Simple Wallet Integration Plan (Frontend + Backend)

> ⚠️ **Security Warning**
>
> The flow below mirrors `STEP_BY_STEP.md`: the mnemonic/private key lives unencrypted in `localStorage`. Use **testnet ADA only**. Do **not** ship this architecture to production.

## Goals

1. Generate a Cardano testnet wallet client-side during registration.
2. Persist only the bech32 address in Postgres via the existing Express API.
3. Keep the mnemonic in the browser (localStorage) for demo interactions.
4. Relay balance lookups and CBOR submissions through the backend Blockfrost proxy that already exists under `backend/controllers/walletController.js`.

---

## Backend Plan (`backend/`)

### 1. Database
- Migration already adds `wallet_address`, `wallet_label`, etc. If following the simplified doc, ensure `users` table at least has `cardano_address`.
- For the alternate no-encryption path, only `cardano_address` (unique) is required. Re-run migrations or add a lightweight `ALTER TABLE` if needed.

### 2. Auth Routes
- Update `controllers/authController.js` (register handler) to accept `cardano_address` from the body and store it alongside email/password.
- Do **not** accept mnemonic/keys. Just trust the client-supplied address for this testnet flow.

### 3. Wallet Proxy
- Reuse `routes/wallet.js` + `walletController.js` to expose:
  - `POST /api/wallet/balance` → Blockfrost address info
  - `POST /api/wallet/submit` → CBOR relay
- Confirm `.env` provides `BLOCKFROST_API_KEY` and `CARDANO_NETWORK=preprod` for consistent testnet experience.

### 4. Test Checklist
- Seed a dummy user with `cardano_address`.
- Hit `/api/wallet/balance` with that address + JWT to verify the proxy responds.
- POST a known-good signed CBOR hex via `/api/wallet/submit` to ensure Blockfrost relays it.

---

## Frontend Plan (`frontend/`)

### 1. Registration Flow
- File: `src/app/register/page.tsx` (or related form component).
- Steps when the user submits:
  1. Use `@emurgo/cardano-serialization-lib-asmjs` to generate entropy and derive a **testnet** address.
  2. Persist the mnemonic in `localStorage` under a clear key (e.g., `user_mnemonic`).
  3. Send `cardano_address` with the rest of the registration payload to `/api/auth/register`.
  4. Show a toast reminding users the mnemonic only exists in this browser profile.

### 2. Wallet Context Adjustments
- Existing `WalletContext.tsx` focuses on CIP-30. For this exercise:
  - Add helpers to detect if `localStorage.getItem("user_mnemonic")` exists.
  - If so, derive the bech32 address and expose it as the "manual" wallet.
  - Optionally still support CIP-30 connect for extra credit; manual mode remains the baseline.

### 3. Manual Send Component *(legacy)*
- `ManualWalletPanel.tsx` originally surfaced address + CBOR relay. In the Lace-focused build this component now renders transaction history pulled from the connected wallet; use the sidebar connector for any remaining manual linking.
- Extend it to:
  - Auto-fill the linked address from the user profile (`user.cardano_address`).
  - Provide a "Load mnemonic from this browser" button that reminds users where the seed resides.
  - Build and sign transactions entirely in-browser using the mnemonic when the user clicks **Build & Sign**, then reuse the existing relay endpoint for submission.

### 4. Notes Page Integration
- `src/app/page.tsx` now shows the manual panel under "My Notes". Keep the CIP-30 card hidden unless users explicitly connect a browser wallet.
- Add status chips (e.g., "Mnemonic present in this browser" vs. "Missing mnemonic") using `localStorage` checks.

### 5. UX Copy
- Everywhere the manual workflow appears, repeat the warning: "Testnet only. Mnemonic stored in this browser." This includes tooltips, the registration success message, and the manual panel banner.

### 6. Testing Steps
- Register a user; confirm network requests send `cardano_address` only.
- Inspect `localStorage` to ensure the mnemonic is available.
- Visit the manual panel, paste a prebuilt signed CBOR, and verify `/api/wallet/submit` returns a hash.
- (Optional) Extend the manual panel to call `getAddressUtxos` and display testnet balance for the stored address using the backend proxy.

---

## Rollout Checklist

1. **Backend**
   - [ ] Confirm migration/state includes `cardano_address`.
   - [ ] Update register controller + validation.
   - [ ] Smoke-test wallet proxy endpoints.

2. **Frontend**
   - [ ] Registration form derives testnet wallet + stores mnemonic locally.
   - [ ] Manual panel auto-populates address and references the mnemonic.
   - [ ] Send flow relays via `/api/wallet/submit`.

3. **Documentation**
   - [ ] Keep `STEP_BY_STEP.md` + this plan linked from `README.md` for graders.
   - [ ] Mention that the flow is intentionally insecure and testnet-only.

Following the steps above keeps the simple wallet integration aligned with both `frontend/` and `backend/` folders while matching the classroom constraints.