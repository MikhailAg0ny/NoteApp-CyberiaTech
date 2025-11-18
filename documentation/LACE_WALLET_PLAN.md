# Lace Wallet Integration Plan

> 🎯 **Objective**
>
> Replace the temporary "local mnemonic" flow with a proper CIP-30 browser wallet experience that specifically targets the Lace (a.k.a. Lace Anatomy) extension. This document describes the tasks required to make Lace the primary wallet for the NoteApp frontend while keeping the backend proxy stable.
>
> ⚠️ **Important**
>
> - Lace exposes the standard CIP-30 API, so everything here should stay compatible with other wallets (Nami, Eternl, Flint) as a fallback.
> - No mnemonics or private keys should ever be stored in our backend or frontend code once this plan is adopted.
> - Blockfrost credentials stay server-side; the frontend always talks to our `/api/wallet/*` proxy.
>
> Use this checklist together with `STEP_BY_STEP.md` and the existing wallet controllers.
>
> ---
>
> ## High-Level Goals
>
> 1. **Frontend**
>    - Detect Lace via `window.cardano.lace` (with fallback to other CIP-30 wallets).
>    - Guide the user through Lace's permission prompts.
>    - Fetch addresses, balance, UTxOs, and submit transactions via the extension.
>    - Provide status chips/tooltips so graders know Lace is the intended path.
>
> 2. **Backend**
>    - Keep the `/api/wallet/balance`, `/api/wallet/utxos`, and `/api/wallet/submit` endpoints as-is.
>    - Ensure JWT-protected routes still work when the frontend stops sending `cardano_address` during registration.
>    - (Optional) Store whichever address Lace reports so we can prefill manual panels or show linked state.
>
> 3. **Docs & Demo**
>    - Update READMEs so testers know to install Lace, enable CIP-30, and connect via the new UI entry point.
>    - Provide a short "demo script" describing how to connect Lace, sign a transaction, and view balance.
>
> ---
>
> ## Task Tracker
>
>| # | Area | Task | Owner | Status |
>|---|------|------|-------|--------|
>| 1 | Frontend | Update `WalletContext.tsx` to prioritize `window.cardano.lace`, including custom icon + detection messaging. | FE | ☐ |
>| 2 | Frontend | Refresh `WalletConnector.tsx` UI copy to explicitly call out Lace and show a "Lace Ready" badge when detected. | FE | ☐ |
>| 3 | Frontend | Remove the local mnemonic registration flow; registration should only collect account info (email/password). | FE | ☐ |
>| 4 | Backend | Confirm `/api/auth/register` no longer requires `cardano_address`; optional linking occurs post-login. | BE | ☐ |
>| 5 | Frontend | Allow the user to link their Lace address after connection (via `/api/wallet/link`) so manual tools can reuse it. | FE | ☐ |
>| 6 | QA/Docs | Document Lace installation + troubleshooting in `documentation/` and reference it from both READMEs. | Shared | ☐ |
>
> ---
>
> ## Backend Plan
>
> 1. **Schema & Auth**
>    - Keep `users.cardano_address` (and the other wallet columns) but make it optional again.
>    - Update `controllers/authController.js` so `/api/auth/register` only requires `email` + `password`.
>    - Add a new helper in `walletController.linkWallet` to accept addresses provided by the frontend after a Lace connect.
>
> 2. **Environment**
>    - `.env` must still define `CARDANO_NETWORK=preprod`, `BLOCKFROST_API_URL`, and `BLOCKFROST_API_KEY`.
>    - Double-check that `services/cardanoService.js` already covers Lace's network requirements (it does if `CARDANO_NETWORK` is set correctly).
>
> 3. **Endpoints**
>    - `/api/wallet/config`: include a `preferredWallet` field set to `"lace"` so the frontend can highlight it.
>    - `/api/wallet/link`: no change except allowing Lace to overwrite older manual links.
>    - `/api/wallet/submit`: keep the security boundary; the frontend should pass the signed CBOR string Lace returns.
>
> ---
>
> ## Frontend Plan
>
> 1. **Detection + Context (`WalletContext.tsx`)**
>    - Update `WALLET_PREFERENCES` so Lace is first in the order.
>    - When `window.cardano.lace` exists, show a dedicated icon/badge.
>    - On `connectWallet`, if the selected key is `lace`, call `enable()` and then `api.getUsedAddresses()` / `api.getChangeAddress()` same as other wallets.
>    - Store Lace-specific metadata (e.g., version) so we can display it later.
>
> 2. **Connector UI (`WalletConnector.tsx`)**
>    - Replace the old "Manual wallet" hero copy with instructions aimed at Lace users.
>    - Add a "Install Lace" CTA if `window.cardano.lace` is undefined.
>    - When connected, show states like `"Lace connected"`, `"Address linked to account"`, etc.
>
> 3. **Manual Panel / Notes Page**
>    - Manual fallback should remain, but the first/primary instructions should encourage Lace connection.
>    - If the user has a linked address (from Lace) display it as read-only info in `ManualWalletPanel.tsx`.
>    - Remove copy about `localStorage` mnemonics entirely once Lace flow is live.
>
> 4. **Registration + Settings**
>    - Simplify `src/app/register/page.tsx` back to an email/password form.
>    - Add a "Connect Lace" step in Settings to reinforce the new flow after login.
>
> ---
>
> ## Testing & Demo Script
>
> 1. **Local Setup**
>    - Install the Lace browser extension (Chrome/Edge) and enable testnet/preprod in its settings.
>    - Run both backend (`npm run dev` in `backend/`) and frontend (`npm run dev` in `frontend/`).
>
> 2. **Functional Tests**
>    - Register a user (no wallet fields required).
>    - Open the wallet drawer, click "Connect Lace", approve the permission popup.
>    - Ensure `/api/wallet/link` is called with the address returned by Lace.
>    - Trigger `refreshBalance`—it should call `/api/wallet/balance` via Blockfrost proxy and show ADA amount.
>    - Use the existing send panel to construct a transaction; when Lace returns the signed CBOR, forward it to `/api/wallet/submit`.
>
> 3. **Edge Cases**
>    - Lace not installed → show CTA + documentation link.
>    - Lace installed but locked → prompt the user to unlock.
>    - User switches to Preview/Mainnet inside Lace → surface a warning if `config.network !== walletNetwork`.
>
> 4. **Documentation**
>    - New section in `frontend/README.md`: "How to connect Lace".
>    - Update `backend/README.md` with a reminder that addresses now arrive via `/api/wallet/link` instead of registration.
>
> ---
>
> ## Risk Callouts
>
> - **Network mismatch**: Lace might be on mainnet while our backend points to preprod. Always compare `api.getNetworkId()` against `config.network`.
> - **Permission persistence**: Lace revokes permissions when the site origin changes; be ready to handle reconnects gracefully.
> - **Rate limits**: Keep reusing the same Blockfrost project. Cache balances client-side to avoid avoidable API hits during demos.
> - **Fallback story**: If Lace is down, we should still allow manual address linking (existing feature) so graders can keep testing.
>
> ---
>
> ## Rollout Checklist
>
> 1. **backend/**
>    - [ ] Update auth controller + migrations to make wallet fields optional again.
>    - [ ] Add `preferredWallet` key to `/api/wallet/config` response.
>    - [ ] Retest wallet proxy endpoints.
>
> 2. **frontend/**
>    - [ ] Remove mnemonic generation code from `register/page.tsx`.
>    - [ ] Update `WalletContext` + `WalletConnector` for Lace-first flows.
>    - [ ] Refresh Manual Panel copy to clarify Lace vs manual fallback.
>    - [ ] Add documentation links/toasts inside the UI for Lace installation.
>
> 3. **Docs**
>    - [ ] Reference this plan from `README.md` files.
>    - [ ] Provide a short FAQ ("Lace not detected", "Wrong network", "Permission denied").
>
> Once everything above is complete, Lace becomes the primary, secure wallet integration path without storing mnemonics directly in the application.


### Frontend (`frontend/.env.local`)
1. Copy `frontend/.env.local.example` to `frontend/.env.local`.
2. Replace placeholders with real values:
   ```dotenv
   NEXT_PUBLIC_ENABLE_WALLET=true
   NEXT_PUBLIC_CARDANO_NETWORK=preview
   NEXT_PUBLIC_BLOCKFROST_API_URL=https://cardano-preview.blockfrost.io/api/v0
   NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=preview_replace_with_blockfrost_project_id
   NEXT_PUBLIC_API_BASE=http://localhost:5000
   ```
3. Restart `npm run dev` so the new env vars load.
4. If the backend runs on a different host/port, update `NEXT_PUBLIC_API_BASE` accordingly.
