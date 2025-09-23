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

exports.updateNote = async (id, title, content) => {
  const res = await pool.query(
    'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, title, content, created_at, updated_at',
    [title, content, id]
  );
  return res.rows[0];
};

exports.deleteNote = async (id) => {
  const res = await pool.query(
    'DELETE FROM notes WHERE id = $1 RETURNING id',
    [id]
  );
  return res.rows[0];
};