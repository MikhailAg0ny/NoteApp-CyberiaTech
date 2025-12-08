# Final Notes App – Blockchain Steps

This guide converts the instructor’s final requirements into an actionable, step-by-step plan for the Lace/Blaze-based notes app on the Cardano preview network.

## 0) Core rules
- Wallet = auth. (Keep or present login/signup only if you choose to.)
- Every note Create/Update/Delete must build, sign, and submit a transaction.
- Attach metadata that includes the note content (chunked to 64-byte strings), action, timestamp, and optionally note_id.
- Use the DB as a fast cache; chain is the source of truth.

## 1) Environment
- Use preview: `CARDANO_NETWORK=preview`, `BLOCKFROST_API_URL=https://cardano-preview.blockfrost.io/api/v0`.
- Keep secrets in `.env` (backend) and `.env.local` (frontend): `BLOCKFROST_API_KEY`, `NEXT_PUBLIC_BLOCKFROST_PROJECT_ID`, `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_ENABLE_WALLET=true`.
- Gitignore all env files; restart servers after edits.

## 2) Database & schema
- Notes table should include at least: `id`, `address`, `txhash`, `status` (pending/confirmed), `note_content`, `action`, `created_at`.
- On save, immediately insert with `status='pending'` and render it in the UI.

## 3) Tx build/send flow (Blaze + Lace)
- On note Create/Update/Delete:
  1. Get wallet API from Lace (`WalletContext` connect flow).
  2. Build tx with Blaze and pay a minimal amount (or your chosen lovelace budget) to the target address.
  3. Construct metadata map:
     - label: pick a unique bigint (e.g., `42819n`).
     - fields: `action`, `note` (chunked), `created_at`, optional `note_id`.
  4. Attach metadata, complete, sign, and submit.
  5. Persist `{address, txhash, status='pending', note_content, action}` to the DB immediately.

### Chunking helper (64-byte safe)
```ts
import { Core } from "@blaze-cardano/sdk";

export function formatContent(content: string) {
  if (!content) return Core.Metadatum.newText("");
  if (content.length <= 64) {
    return Core.Metadatum.newText(content);
  }
  const chunks = content.match(/.{1,64}/g) || [];
  const list = new Core.MetadatumList();
  chunks.forEach((chunk) => list.add(Core.Metadatum.newText(chunk)));
  return Core.Metadatum.newList(list);
}
```

## 4) Background worker (status sync)
- Run every ~20s:
  1. Query DB for notes where `status='pending'`.
  2. For each `txhash`, call Blockfrost `/txs/{hash}` (preview base URL).
  3. If 200 OK, mark note `status='confirmed'`; if 404, leave pending.
- Can be a Node script/cron or an in-app interval if acceptable.

## 5) Recover from chain
- If DB is wiped: fetch transactions via Blockfrost using your address(es), read metadata label, reconstruct notes, and repopulate the DB.

## 6) UI requirements
- Wallet connect is primary auth. If you keep login/signup, align its UX with wallet state.
- Show note status (pending/confirmed) in the notes list.
- Keep Lace connect/Send-ADA + history panels available; manual link only as fallback.

## 7) Verification checklist
- Env points to preview and loads in both servers.
- CRUD triggers tx build/sign/submit with metadata (check in Blockfrost).
- Notes appear instantly with `pending` status, then flip to `confirmed` after worker sync.
- Chunking works for long notes; no 64-byte metadata errors.
- DB wipe recovery works via Blockfrost metadata replay.

Deliver this file alongside your app to show compliance with the final specs.
