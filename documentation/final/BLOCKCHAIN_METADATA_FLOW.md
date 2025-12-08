# Blockchain Metadata Flow — Step by Step

This note details how the Notes App wires every Create/Update/Delete operation to a Cardano metadata transaction and keeps the UI in sync, highlighting the exact pieces of code that make it happen.

## 1. Wallet + metadata prerequisites
- `frontend/src/app/contexts/WalletContext.tsx` loads the connected wallet API (Lace/Nami) and exports `submitNoteTransaction`.
- Metadata label: uses the constant `DEFAULT_METADATA_LABEL = 42819n` so every tx uses the same label unless overridden.
- Content chunking helper `formatContent` splits long notes into 64-byte `Core.Metadatum.newText` entries, wrapping them in a list when necessary.

## 2. Building the Blaze transaction with metadata (opt-in)
The UI only builds/signs metadata when the user checks the Cardano metadata toggle in the Create/Note modals. When enabled, `submitNoteTransaction` performs:
1. Determine network (preview/preprod/mainnet) from `selectedNetwork`; config builds the Blockfrost provider accordingly.
2. Create a `Core.MetadatumMap`:
   - Insert `action` (create/update) and `created_at` (ISO timestamp).
   - Insert `note` via the chunked `formatContent` result.
   - Wrap map into `Core.Metadata` under the chosen label.
3. Build a Blaze transaction that pays a small amount (default `1_500_000` lovelace) back to the wallet address and attaches the metadata.
4. Sign the tx via the wallet API and submit it via `blaze.provider.postTransactionToChain` (Blockfrost hosts the relay).
5. Return `{ txHash, cardanoAddress, label, metadata }` to the caller.

## 3. Passing metadata to the backend
- `frontend/src/app/page.tsx` (values called from `addNote` or `saveNoteChanges`):
  - Calls `submitNoteTransaction` before issuing the REST request.
  - Adds the returned metadata payload to the request body:
    ```ts
    {
      tx_hash,
      tx_status: 'pending',
      cardano_address,
      chain_action,
      chain_label,
      chain_metadata,
    }
    ```
- Backend `backend/models/noteModel.js` updates `createNote`/`updateNote` to accept the `txMeta` object and store the fields (defaults `tx_status='pending'`).

## 4. Immediate UI feedback
- The note list/modal (`page.tsx`, `NoteModal.tsx`) show the tx status (Pending/Confirmed) and short tx hash for context when metadata was sent.
- Since the row already contains `tx_hash` and `tx_status='pending'`, users see the note as soon as metadata submission succeeds (when opted in).

## 5. Confirmation sync
1. `page.tsx` polls Blockfrost every ~25 seconds when pending txs exist.
2. It hits `/txs/{tx_hash}` using the network-specific Blockfrost URL.
3. On 200 OK the note is updated via `PUT /api/notes/:id` with `tx_status='confirmed'`.
- Tip: Move this to a background worker or webhook for higher reliability; current code keeps the DB cache consistent as long as the user stays on the page.

## 6. Metadata recovery (optional)
- To rebuild the DB after a wipe:
  - Fetch transactions from Blockfrost or Cardano explorer for the recorded address.
  - The metadata label/fields follow the pattern above (`action`, `note`, `created_at`); you can parse the chunked list or use serde to join text entries.

## 7. Where to inspect the implementation
- `frontend/src/app/contexts/WalletContext.tsx` — Blaze tx construction, metadata map creation, `formatContent`, and network selection.
- `frontend/src/app/page.tsx` — metadata injection into API calls, status badges, and Blockfrost polling.
- `backend/models/noteModel.js` — storing `tx_*` columns; `backend/controllers/notesController.js` exposes those fields through the API so the UI can store them.

## 8. Lace account linking rules (single-address safety)
- One wallet per user: the backend enforces a unique non-null `wallet_address` and now rejects swapping to a different address for the same user unless you unlink first (`POST /api/wallet/link` returns 409 with guidance).
- Frontend guardrails: `WalletContext` prevents linking a different Lace account while another is linked (connect, manual link, and persist flows throw with a clear unlink-first message).
- User flow: to change Lace accounts, first unlink in the app, then switch accounts in the Lace extension, then link again. This avoids silent account swaps while a session is active.

## 8. Quick mental checklist for each note action
| Step | What happens | Code reference |
| --- | --- | --- |
| Build metadata | `submitNoteTransaction` prepares map with `action`, `note`, `created_at`. | `WalletContext.tsx: formatContent + submitNoteTransaction` |
| Sign & send | Blaze builds tx, attaches metadata, wallet signs, sends via Blockfrost. | `Blaze.newTransaction().setMetadata(...)/signTransaction` |
| Store in DB | Backend stores `tx_*` columns with `tx_status='pending'`. | `noteModel.createNote`/`updateNote` |
| Show status | UI badges show `pending` + tx hash snippet. | `page.tsx`/`NoteModal.tsx` |
| Confirmed | Client polls Blockfrost; on success backend flips status to `confirmed`. | `page.tsx` polling effect |

This guide should give you a concise, step-by-step mental model of how blockchain metadata powers each note operation. For deeper context, cross-reference the files listed above.