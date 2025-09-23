const pool = require('../db');

exports.listTags = async (userId) => {
  const res = await pool.query(
    'SELECT tag_id, name FROM tags WHERE user_id=$1 ORDER BY name ASC',
    [userId]
  );
  return res.rows.map(r => ({ id: r.tag_id, name: r.name }));
};

exports.createTag = async (userId, name) => {
  name = (name || '').trim();
  if (!name) return null;
  const res = await pool.query(
    'INSERT INTO tags (user_id, name) VALUES ($1,$2) ON CONFLICT (user_id, name) DO UPDATE SET name=EXCLUDED.name RETURNING tag_id, name',
    [userId, name]
  );
  const r = res.rows[0];
  return { id: r.tag_id, name: r.name };
};

exports.deleteTag = async (userId, id) => {
  const res = await pool.query(
    'DELETE FROM tags WHERE user_id=$1 AND tag_id=$2 RETURNING tag_id AS id',
    [userId, id]
  );
  return res.rows[0] || null;
};
