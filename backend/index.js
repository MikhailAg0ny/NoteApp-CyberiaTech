const express = require('express');
require('dotenv').config();

const notesRouter = require('./routes/notes');
const pool = require('./db');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('NoteApp backend is running'));
app.use('/api/notes', notesRouter);

// Test DB connection on startup
(async () => {
  try {
    const r = await pool.query('SELECT NOW()');
    console.log('Connected to Postgres at', r.rows[0].now);
  } catch (err) {
    console.error('Postgres connection failed:', err.message);
  }
})();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
