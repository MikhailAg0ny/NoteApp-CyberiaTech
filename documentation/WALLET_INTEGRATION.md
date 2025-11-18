# Cardano Wallet Integration Guide

Wallet connectivity is now wired end-to-end: the backend proxies Blockfrost, and the frontend exposes a Wallet context plus UI entry points. This guide captures the required environment variables, file locations, and verification steps.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1 – Configure Environment](#step-1--configure-environment)
- [Step 2 – Backend Service](#step-2--backend-service)
- [Step 3 – Frontend Context](#step-3--frontend-context)
- [Step 4 – UI Components](#step-4--ui-components)
- [Step 5 – Wallet-aware Notes UI](#step-5--wallet-aware-notes-ui)
- [Step 6 – Verification](#step-6--verification)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js ≥ 18 (matches Next.js 15 + latest Express requirements)
- npm CLI
- Cardano browser wallet (Nami, Eternl, or Flint) installed and unlocked
- Blockfrost API key with access to the target network (`preprod` by default)

## Step 1 – Configure Environment

Sample templates now live in the repo:

- `backend/.env.example`
- `frontend/.env.local.example`

Populate the real files (`backend/.env`, `frontend/.env.local`) using the templates and **do not commit them** (the root `.gitignore` explicitly ignores these secrets).

Backend keys:

```dotenv
CARDANO_NETWORK=preprod
BLOCKFROST_API_URL=https://cardano-preprod.blockfrost.io/api/v0
BLOCKFROST_API_KEY=your_blockfrost_key
```

Frontend keys:

```dotenv
NEXT_PUBLIC_ENABLE_WALLET=true
NEXT_PUBLIC_CARDANO_NETWORK=preprod
NEXT_PUBLIC_BLOCKFROST_API_URL=https://cardano-preprod.blockfrost.io/api/v0
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=replace_with_blockfrost_project_id
NEXT_PUBLIC_API_BASE=http://localhost:5000
```

## Step 2 – Backend Service

Files added under `backend/`:

- `services/cardanoService.js` – Thin HTTPS client for Blockfrost endpoints (config, address info, UTxOs, CBOR submission).
- `controllers/walletController.js` – Maps Express handlers to the service helpers.
- `routes/wallet.js` – Exposes `/api/wallet/config|balance|utxos|submit` (protected by the existing JWT middleware).
- `index.js` – Registers the new router (`app.use('/api/wallet', authMiddleware, walletRouter);`).

The backend never sees private keys; it only accepts already-signed transactions from the browser and relays them to Blockfrost.

## Step 3 – Frontend Context

Key files under `frontend/src/app/`:

- `contexts/WalletContext.tsx` – Client-only provider that
  - detects installed CIP-30 wallets via `window.cardano`
  - loads `@emurgo/cardano-serialization-lib-browser` to convert hex addresses to bech32
  - tracks connection state, balance, lovelace amount, and Blockfrost/Network metadata (fetched from `/api/wallet/config`)
  - exposes `connectWallet`, `disconnectWallet`, `refreshBalance`, and `submitAdaPayment` (Blaze helper that requires `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID`)
- `layout.tsx` now wraps everything with `<WalletProvider>` so any component can call `useWallet()`.

## Step 4 – UI Components

- `components/WalletConnector.tsx` renders a sidebar card that lists detected wallets, handles connect/disconnect, surfaces balances, and shows errors.
- `components/Sidebar.tsx` imports the connector and places it above the Settings button, so users can link wallets from anywhere in the app UI.
- `components/SendAdaPanel.tsx` provides a Blaze-powered send form (recipient + ADA amount) that reuses the connected wallet session for signing and submits directly to Blockfrost.

## Step 5 – Wallet-aware Notes UI

`src/app/page.tsx` queries `useWallet()` and displays a banner under the filters:

- Connected wallets show a green pulse indicator, truncated address, and current ADA balance.
- Disconnected state prompts the user to connect (or install) a wallet, providing a one-click shortcut that picks the first detected extension.

## Step 6 – Verification

1. Start the backend with a valid `.env`:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

2. Start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. Sign in to the NoteApp UI so JWT-protected wallet routes can be called.
4. Open the sidebar wallet card, connect Nami/Eternl/Flint, and verify:
   - `/api/wallet/config` loads (network + Blockfrost URL rendered under the wallet name).
   - `/api/wallet/balance` returns ADA + lovelace amounts.
5. Use the new Send ADA panel (or your own component via `submitAdaPayment`) to build+sign+submit a lovelace transfer directly from the linked wallet.
6. (Optional) Manually build and sign a transaction within the browser and POST the CBOR hex to `/api/wallet/submit` to confirm the backend relay path still behaves as expected.

## Usage Examples

Accessing the context inside any client component:

```tsx
"use client";
import { useWallet } from "@/app/contexts/WalletContext";

export function WalletStatusBadge() {
  const { connectedWallet, address, balanceAda } = useWallet();
  if (!connectedWallet || !address) return null;
  return (
    <span>
      {connectedWallet.label}: {balanceAda?.toFixed(2) ?? "--"} ADA
    </span>
  );
}
```

Submitting a CBOR payload from the browser (after signing with the CIP-30 API):

```ts
async function submitSignedTx(cborHex: string, token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/wallet/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cbor: cborHex })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `Wallet features are disabled` | Set `NEXT_PUBLIC_ENABLE_WALLET=true` and restart `next dev`. |
| `Unable to derive wallet address` | Unlock the browser wallet and ensure `@emurgo/cardano-serialization-lib-browser` loaded (check browser console). |
| `Balance fetch failed (401)` | User JWT expired – log out/in so `/api/wallet/*` requests include a valid token. |
| `Blockfrost 403` | Verify `BLOCKFROST_API_KEY` has access to the configured network. |

## Security Notes

- Blockfrost keys remain server-side; never copy them into the frontend env file.
- Transactions are always signed inside the wallet extension – the backend only relays CBOR blobs.
- Treat wallet addresses as user data; avoid logging them in production.

## Additional References

- [Cardano Developer Portal](https://developers.cardano.org/)
- [Blockfrost Docs](https://docs.blockfrost.io/)
- [CIP-30 Wallet API](https://cips.cardano.org/cips/cip30/)

_Last updated: November 18, 2025_
