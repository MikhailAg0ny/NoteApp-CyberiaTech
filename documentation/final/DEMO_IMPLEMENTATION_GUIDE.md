# Demo Implementation Guide — Focused on Final Requirements

This file is a focused demonstration of how this repository implements the FINAL requirements for the Notes App blockchain integration (see `documentation/final/FINAL_NOTES_APP_BLOCKCHAIN_STEPS.md`). It lists the exact rules implemented, how they map to code, and step-by-step instructions to run and verify the system.

**Core rules implemented**
- Wallet = primary auth: the app supports wallet-based flows; login/signup are left intact for optional use.
- Every Create/Update/Delete operation can build, sign, and submit a Cardano transaction containing metadata about the action.
- Metadata includes: `action`, `note` (chunked to 64-byte entries), `created_at`, and optionally `note_id`.
- Database acts as a fast cache; chain metadata is the source of truth. Notes insert/update with `tx_status='pending'` and are flipped to `confirmed` after on-chain verification.

1) Environment and secrets
- Frontend expects `NEXT_PUBLIC_API_BASE` and `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID` in `frontend/.env.local`.
- Backend expects `BLOCKFROST_API_KEY` and DB connection in `backend/.env`.
- For development use the preview/mainnet selection in the UI; the app maps the selection to the correct Blockfrost base URL.

2) Database and schema
- Migration: `backend/migrations/2025-12-08_add_note_tx_columns.sql` (adds `tx_hash`, `tx_status`, `cardano_address`, `chain_action`, `chain_label`, `chain_metadata`).
- Model: `backend/models/noteModel.js` accepts `txMeta` in `createNote` and `updateNote`, stores the fields immediately (defaults `tx_status` to `pending`).

3) Transaction metadata flow (what code does)
- Frontend helper: `frontend/src/app/contexts/WalletContext.tsx` implements `submitNoteTransaction`:
  - Prepares metadata map with a numeric label (default `42819n`).
  - Uses helper `formatContent` to chunk note content into 64-byte Metadatum entries.
  - Builds a Blaze transaction that pays a small lovelace amount to the sender/target address, attaches the metadata map, completes, requests the wallet to sign, and posts the signed tx via the Blockfrost provider.
  - Returns `{ txHash, cardanoAddress, label, metadata }` on success.

- Frontend API calls: `frontend/src/app/page.tsx`:
  - Calls `submitNoteTransaction` before creating/updating the note.
  - Sends returned metadata in the note payload: `tx_hash`, `tx_status` (set to `'pending'`), `cardano_address`, `chain_action`, `chain_label`, `chain_metadata`.

- Backend persistence: `noteModel.createNote` and `updateNote` persist those fields; the row is visible immediately to users.

Chunking helper (used in code)
```ts
// See WalletContext.formatContent
import { Core } from "@blaze-cardano/sdk";
export function formatContent(content: string) {
  const safe = content || "";
  if (safe.length <= 64) return Core.Metadatum.newText(safe);
  const chunks = safe.match(/.{1,64}/g) || [];
  const list = new Core.MetadatumList();
  chunks.forEach((c) => list.add(Core.Metadatum.newText(c)));
  return Core.Metadatum.newList(list);
}
```

4) Confirmation sync (background worker / polling)
- The demo implementation currently uses client-side polling in `frontend/src/app/page.tsx`:
  - Every ~25s the app checks Blockfrost `/txs/{hash}` for notes with `tx_status='pending'`.
  - If Blockfrost returns 200 OK for a tx hash, the app issues a `PUT /api/notes/:id` to set `tx_status='confirmed'` (the backend accepts and persists this).
- Recommended production improvement: implement a server-side worker or webhook to avoid relying on client sessions.

5) Recovery from chain
- If DB is lost, the approach is to query Blockfrost for transactions associated with the app addresses and reconstruct notes from metadata labels and maps. The codebase provides the metadata format used so a recovery script can parse and repopulate the DB.

6) UI specifics
- Status badges: `frontend/src/app/page.tsx` and `frontend/src/app/components/NoteModal.tsx` display `Pending` / `Confirmed` badges and short tx hash snippets.
- Network selection: `frontend/src/app/components/ManualWalletPanel.tsx` exposes a network dropdown (Mainnet/Preprod/Preview) that sets a shared `selectedNetwork` in `WalletContext`. The selected network is used for Blockfrost provider configuration and explorer links.
- Sidebar scrollable: `frontend/src/app/components/Sidebar.tsx` now allows vertical scrolling.

7) Verification checklist (what to validate)
- Environment points to preview (or chosen network) and servers start cleanly.
- Creating/updating/deleting a note when a wallet is connected builds a Blaze tx with metadata and returns a `tx_hash`.
- The frontend immediately shows the note with `tx_status='pending'`.
- When Blockfrost reports the tx present, the note row flips to `confirmed`.
- Long notes are chunked correctly into 64-byte parts — check metadata in Blockfrost.

Quick start commands (Windows PowerShell)
```powershell
# Backend
cd backend
npm install
# put .env with BLOCKFROST_API_KEY and DATABASE_URL
npm run dev

# Apply migration (example using psql)
psql $env:DATABASE_URL -f ./backend/migrations/2025-12-08_add_note_tx_columns.sql

# Frontend
cd ../frontend
npm install
# put .env.local with NEXT_PUBLIC_API_BASE and NEXT_PUBLIC_BLOCKFROST_PROJECT_ID
npm run dev
```

Where to look in the code
- `backend/migrations/2025-12-08_add_note_tx_columns.sql`
- `backend/models/noteModel.js` and `backend/controllers/notesController.js`
- `frontend/src/app/contexts/WalletContext.tsx` (submitNoteTransaction, formatContent)
- `frontend/src/app/page.tsx` (calls to submitNoteTransaction, tx metadata forwarding, polling)
- `frontend/src/app/components/ManualWalletPanel.tsx` (network selector)

Limitations & recommended next steps
- Move confirmation sync to a server-side worker or webhook to keep the DB authoritative without client polling.
- Avoid exposing Blockfrost project id on the frontend for production; use server proxy endpoints for fetches that require the key.
- Add an automated recovery script to rebuild DB from on-chain metadata if desired.

This document aligns the implemented code to the FINAL requirements and shows how to test and verify the metadata transaction lifecycle end-to-end.
# Demo Implementation Guide — Notes App Blockchain Flow

This document demonstrates how the Cardano metadata transaction flow was implemented in this repository and how to run and verify it locally (preview/mainnet options supported).

Overview
- This repo implements create/update/delete operations for notes that optionally submit a Cardano transaction containing note metadata (action, chunked content, timestamp) using Blaze + a browser wallet (Lace/Nami/etc.).
- The DB stores tx metadata immediately with `tx_status = 'pending'`. The frontend polls Blockfrost to flip pending transactions to `confirmed` when the transaction is found on chain.

Key files changed
- Backend
  - `backend/migrations/2025-12-08_add_note_tx_columns.sql` — adds `tx_hash`, `tx_status`, `cardano_address`, `chain_action`, `chain_label`, `chain_metadata` to `notes`.
  - `backend/models/noteModel.js` — save and return tx metadata fields; create/update accept optional `txMeta`.
  - `backend/controllers/notesController.js` — accepts tx metadata in create/update endpoints (see `txMeta` payload handling).

- Frontend
  - `frontend/src/app/contexts/WalletContext.tsx` — new helper `submitNoteTransaction` builds Blaze transactions with metadata (action, chunked note content, created_at), signs with the connected wallet, posts to Blockfrost, and returns `{txHash, cardanoAddress, label, metadata}`. Context exposes `selectedNetwork` and `setSelectedNetwork` so UI can choose network.
  - `frontend/src/app/page.tsx` — note types map now include tx fields; `addNote` and `saveNoteChanges` call the wallet helper to submit a chain tx and include returned tx metadata in the POST/PUT request to the backend. UI shows pending/confirmed badges and polls Blockfrost to confirm pending txs.
  - `frontend/src/app/components/NoteModal.tsx` — displays tx status and short tx hash in the modal header.
  - `frontend/src/app/components/ManualWalletPanel.tsx` — network dropdown (Mainnet/Preprod/Preview) that sets the shared `selectedNetwork` used for Blockfrost calls and explorer links.
  - `frontend/src/app/components/Sidebar.tsx` — sidebar made vertically scrollable.

High-level flow (what happens when you create or edit a note)
1. Frontend: user clicks Create (or Save) in the UI.
2. If a browser wallet is connected, `submitNoteTransaction` is called:
   - Builds metadata map with label (bigint), `action`, `note` (chunked into 64-byte Metadatum entries), and `created_at`.
   - Builds a Blaze tx that pays a small lovelace amount to the sender (or target address). Attaches metadata, completes, asks the wallet to sign, and submits the tx via Blockfrost provider.
   - Returns `txHash`, `cardanoAddress`, `label`, and `metadata`.
3. Frontend immediately includes these fields (`tx_hash`, `tx_status='pending'`, `cardano_address`, `chain_action`, `chain_label`, `chain_metadata`) in the payload to the backend `POST /api/notes` or `PUT /api/notes/:id`.
4. Backend inserts/updates the note row immediately with `tx_status='pending'` (DB cached view).
5. Frontend UI shows the note with a Pending badge and stores the tx hash for quick access.
6. A client-side polling process queries Blockfrost for any pending `tx_hash` values every ~25s (configurable): when Blockfrost returns the tx (200 OK), the app updates the backend note row's `tx_status` to `confirmed`.

Running locally (quick start)
1. Create env files
   - Backend: `backend/.env` (gitignored). Required values (example):

```powershell
BLOCKFROST_API_KEY=your_blockfrost_secret_key
DATABASE_URL=postgres://user:pass@localhost:5432/yourdb
PORT=5000
```

   - Frontend: `frontend/.env.local`

```powershell
NEXT_PUBLIC_API_BASE=http://localhost:5000
NEXT_PUBLIC_ENABLE_WALLET=true
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=your_blockfrost_project_id
```

2. Start the backend

```powershell
cd backend
npm install
npm run dev    # or `node index.js` depending on your scripts
```

3. Apply DB migrations (Postgres)

```powershell
# run your SQL migration tool or psql
psql $DATABASE_URL -f ./backend/migrations/2025-12-08_add_note_tx_columns.sql
```

4. Start the frontend

```powershell
cd frontend
npm install
npm run dev
# open http://localhost:3000 (or the port listed by Next)
```

Testing the flow (what to do in the UI)
1. Connect a browser wallet (Lace/Nami) using the Wallet connector in the app.
2. Optionally choose a network in the Lace panel / `Manual Wallet` selector (Mainnet/Preprod/Preview). The app will use this choice for Blockfrost and explorer links.
3. Create a note with non-trivial content (longer than 64 bytes to exercise chunking).
4. Observe:
   - The note appears immediately in the UI with a `Pending` badge and a short `tx_hash` shown in the modal/preview.
   - On the backend, the note row has `tx_hash` and `tx_status='pending'`.
5. Wait for the polling cycle (or refresh). When Blockfrost reports the transaction exists, the UI will update to `Confirmed` and the backend row will be updated accordingly.

Verifying on chain
- Use the explorer link in the `Manual Wallet` panel or Blockfrost API to fetch `/txs/{txHash}`. The tx's metadata will contain the label and data map (action, note chunks, created_at). The label used in the app is `42819` by default (as a bigint) unless otherwise configured.

Files to inspect for the implementation details
- `frontend/src/app/contexts/WalletContext.tsx` — `submitNoteTransaction`, `selectedNetwork` usage, metadata construction and chunking helper `formatContent`.
- `frontend/src/app/page.tsx` — code that calls `submitNoteTransaction`, sends `tx_*` fields to backend, UI status badge rendering, Blockfrost polling logic.
- `backend/models/noteModel.js` — how `tx_meta` fields are accepted and stored during create/update.
- `backend/controllers/notesController.js` — how create/update endpoints accept the tx metadata payload.

Limitations and recommended improvements
- Current confirmation sync runs on the client (frontend polling Blockfrost). For production, consider a backend worker or webhook that independently verifies txs and updates DB to avoid relying on user sessions.
- The Blockfrost project id/key is used from the frontend for convenience. For greater security, consider proxying confirmations through the backend or a server-side worker and keeping the key secret.
- Consider signing a small policy or using reference scripts if you intend to push larger or more structured metadata off-chain.

Next steps you can take (optional)
- Add backend worker (cron or queue) to query pending txs and update DB.
- Add an audit page that reconstructs notes from on-chain metadata when recovering from DB loss.
- Add deletion chain actions: optionally submit a tx with `action='delete'` before issuing the `DELETE /api/notes/:id`.

Contact / Troubleshooting
- If a tx never moves from `pending` to `confirmed`, check Blockfrost logs and ensure your Blockfrost project id matches the chosen network (preview vs preprod vs mainnet).
- If metadata fails due to size, confirm chunking logic in `WalletContext.formatContent` (it should produce 64-byte chunks as Metadatum list entries).

---
This guide documents the live implementation in this repo and provides the steps you need to run and verify the metadata transaction flow locally.
