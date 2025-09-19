# NoteApp Backend (Express + PostgreSQL)

Setup steps:

1. Copy `.env.example` to `.env` and fill your Postgres credentials.

2. Install dependencies:

```powershell
npm install
```

3. Create the database and `notes` table (use `psql` or `pgAdmin`):

```sql
CREATE DATABASE noteapp;

-- connect to noteapp
-- create notes table
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

4. Start the server:

```powershell
npm run dev
```

The API will be available at `http://localhost:5000/api/notes`.
