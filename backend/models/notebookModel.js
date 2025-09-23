const pool = require('../db');

exports.listNotebooks = async (userId) => {
  const res = await pool.query(
    'SELECT notebook_id, name, created_at FROM notebooks WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  );
  return res.rows.map(r => ({ id: r.notebook_id, name: r.name, created_at: r.created_at }));
};

exports.createNotebook = async (userId, name) => {
  const res = await pool.query(
    'INSERT INTO notebooks (user_id, name) VALUES ($1,$2) RETURNING notebook_id, name, created_at',
    [userId, name]
  );
  const r = res.rows[0];
  return { id: r.notebook_id, name: r.name, created_at: r.created_at };
};

exports.updateNotebook = async (userId, id, name) => {
  const res = await pool.query(
    'UPDATE notebooks SET name=$1 WHERE user_id=$2 AND notebook_id=$3 RETURNING notebook_id, name, created_at',
    [name, userId, id]
  );
  const r = res.rows[0];
  if (!r) return null;
  return { id: r.notebook_id, name: r.name, created_at: r.created_at };
};

exports.deleteNotebook = async (userId, id) => {
  const res = await pool.query(
    'DELETE FROM notebooks WHERE user_id=$1 AND notebook_id=$2 RETURNING notebook_id AS id',
    [userId, id]
  );
  return res.rows[0] || null;
};
