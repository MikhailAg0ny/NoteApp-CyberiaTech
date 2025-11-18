# Wallet Integration Process Checklist

Use this checklist once the Cardano wallet integration code is in place to verify everything end-to-end.

## 1. Prerequisites
- Backend `.env` populated with `CARDANO_NETWORK`, `BLOCKFROST_API_URL`, and `BLOCKFROST_API_KEY`.
- Frontend `.env.local` populated with `NEXT_PUBLIC_ENABLE_WALLET=true`, `NEXT_PUBLIC_CARDANO_NETWORK`, and `NEXT_PUBLIC_BLOCKFROST_API_URL`.
- CIP-30 wallet (Nami, Eternl, or Flint) installed and unlocked in the browser.

## 2. Start services
1. Backend
   ```powershell
   cd backend
   npm install
   npm run dev
   ```
2. Frontend
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

## 3. Authenticate
- Visit `http://localhost:3000/login`, sign in, and confirm a JWT token is stored (required for `/api/wallet/*`).

## 4. Connect a wallet
1. Open the main notes dashboard.
2. In the sidebar wallet card, click **Connect wallet** and pick the desired browser wallet.
3. Approve the connection request in the wallet extension.
4. Expected result: green pulse indicator + truncated address + ADA balance in the banner and sidebar card.

## 5. Refresh balances
- Click the refresh icon on the wallet card to ensure `/api/wallet/balance` responds (watch the browser network tab for `POST /api/wallet/balance`).

## 6. (Optional) Submit a transaction
1. Use the wallet extension to build/sign a simple transaction (e.g., send a minimal ADA amount to yourself).
2. Capture the CBOR hex and POST it via `fetch`/`curl` to `/api/wallet/submit` with the JWT token.
3. Confirm the API returns a transaction hash and monitor it on a Blockfrost explorer.

## 7. Troubleshooting log
- If the UI shows “Wallet features are disabled”, ensure `NEXT_PUBLIC_ENABLE_WALLET=true` and restart `next dev`.
- 401 errors on `/api/wallet/*` mean the JWT expired—re-login.
- Blockfrost 403 errors indicate a mismatched network or invalid API key.

Store this file with the other docs so future contributors can process the wallet integration quickly.
