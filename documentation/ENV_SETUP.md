# Environment Setup Instructions

This guide explains how to populate the secret environment files for the NoteApp backend and frontend, including the Cardano wallet integration keys shown in your snippet.

## 1. Add your secrets

### Backend (`backend/.env`)
1. Copy `backend/.env.example` to `backend/.env`.
2. Populate the database and wallet fields.
   ```dotenv
   PGHOST=localhost
    PGUSER=your_db_user
    PGPASSWORD=your_db_password
    PGDATABASE=noteapp
    PGPORT=5432
    PORT=5000

   CARDANO_NETWORK=preprod
   BLOCKFROST_API_URL=https://cardano-preprod.blockfrost.io/api/v0
   BLOCKFROST_API_KEY=your_real_blockfrost_key
   ```
3. Do **not** commit `backend/.env`; it is already ignored via the root `.gitignore`

### Frontend (`frontend/.env.local`)
1. Copy `frontend/.env.local.example` to `frontend/.env.local`.
2. Replace placeholders with real values:
   ```dotenv
   NEXT_PUBLIC_ENABLE_WALLET=true
   NEXT_PUBLIC_CARDANO_NETWORK=preprod
   NEXT_PUBLIC_BLOCKFROST_API_URL=https://cardano-preprod.blockfrost.io/api/v0
   NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=replace_with_blockfrost_project_id
   NEXT_PUBLIC_API_BASE=http://localhost:5000
   ```
3. Frontend `.env.local` is also gitignored.

## 2. Running the apps
1. Backend:
   ```powershell
   cd backend
   npm install
   npm run dev
   ```
2. Frontend:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

## 3. Tips
- Keep Blockfrost keys secure; use different keys per network (`preprod`, `preview`, `mainnet`).
- Restart servers after updating any `.env` file.
- Use `npm run lint` in each folder to verify no runtime errors from new env settings.

This document complements `documentation/WALLET_INTEGRATION.md` by focusing specifically on secret management and local dev setup.
