const pool = require('../db');

exports.getAllNotes = async () => {
  const res = await pool.query('SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC');
  return res.rows;
};

exports.createNote = async (title, content) => {
  const res = await pool.query(
    'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at',
    [title, content]
  );
  return res.rows[0];
};
