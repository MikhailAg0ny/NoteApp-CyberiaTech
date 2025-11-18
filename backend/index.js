const express = require('express');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const notesRouter = require('./routes/notes');
const authRouter = require('./routes/auth');
const notebooksRouter = require('./routes/notebooks');
const tagsRouter = require('./routes/tags');
const walletRouter = require('./routes/wallet');
const authMiddleware = require('./middleware/auth');
const pool = require('./db');
const noteModel = require('./models/noteModel');

const app = express();
app.use(express.json());

// Simple CORS helper - allow local dev origin by default
app.use((req, res, next) => {
  const allowed = process.env.CORS_ORIGIN || 'http://localhost:3000';
  res.header('Access-Control-Allow-Origin', allowed);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});


app.get('/', (req, res) => res.send('NoteApp backend is running'));
app.get('/health', async (req, res) => {
  try {
    const dbNow = await pool.query('SELECT NOW() as now');
    const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`);
    res.json({
      status: 'ok',
      time: dbNow.rows[0].now,
      tables: tables.rows.map(r => r.table_name)
    });
  } catch (e) {
    res.status(500).json({ status: 'error', error: e.message });
  }
});
app.use('/api/auth', authRouter);
// Protected notes (but keep fallback if no token by using query param) - for now require token strictly
app.use('/api/notes', authMiddleware, notesRouter);
app.use('/api/notebooks', authMiddleware, notebooksRouter);
app.use('/api/tags', authMiddleware, tagsRouter);
app.use('/api/wallet', authMiddleware, walletRouter);

// Test DB connection on startup
(async () => {
  try {
    const r = await pool.query('SELECT NOW()');
    console.log('Connected to Postgres at', r.rows[0].now);
    console.log('Using DB:', process.env.PGDATABASE, 'host:', process.env.PGHOST);
    // Apply all migration files in alphanumeric order
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();
      for (const file of files) {
        const full = path.join(migrationsDir, file);
        const sql = fs.readFileSync(full, 'utf8');
        try {
          await pool.query(sql);
          console.log('Migration applied:', file);
        } catch (e) {
          console.warn('Migration', file, 'failed (continuing):', e.message);
        }
      }
    } else {
      console.warn('Migrations directory missing:', migrationsDir);
    }
    // Ensure notes table structure after migrations
    try { await noteModel._debugEnsure(); console.log('Notes table ensured post-migrations.'); } catch (e) { console.error('Ensure table failed:', e.message); }
  } catch (err) {
    console.error('Postgres connection failed:', err.message);
  }
})();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
