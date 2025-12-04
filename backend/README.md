# NoteApp Backend (Express + PostgreSQL)

Setup steps:

1. Copy `.env.example` to `.env` and fill your Postgres credentials.

2. Install dependencies:

```powershell
npm install
```

3. Create the database and run the migrations in `backend/migrations/` (the server automatically runs them on boot). If you prefer applying them manually, ensure the `users` table has the new `cardano_address` column from `2025-11-18_add_cardano_address_column.sql`.

```sql
CREATE DATABASE noteapp;
-- connect to noteapp and run each *.sql file found under backend/migrations/
```

4. Start the server:

```powershell
npm run dev
```

The API will be available at `http://localhost:5000/api/notes`.

## ⚠️ Wallet modes (testnet only)

- **Preferred (Lace CIP-30):** Follow `documentation/LACE_WALLET_PLAN.md`. Users register with just email/password, then connect Lace and call `/api/wallet/link` to store their bech32 address. No mnemonics are stored by the app.
- **Legacy simple flow:** `documentation/SIMPLE_WALLET_IMPLEMENTATION.md` describes the deprecated "local mnemonic" approach. Only use it for regression testing; it leaves seeds in the browser.
- Regardless of the frontend mode, keep `CARDANO_NETWORK=preprod`, `BLOCKFROST_API_URL`, and `BLOCKFROST_API_KEY` set in `.env` so `/api/wallet/*` can proxy Blockfrost requests without leaking credentials.
