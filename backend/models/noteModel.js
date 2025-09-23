const pool = require('../db');

let schemaMode = null; // 'multi' | 'simple'

async function detectSchema() {
  if (schemaMode) return schemaMode;
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='notes'");
  const names = cols.rows.map(r => r.column_name);
  if (names.includes('note_id') && names.includes('user_id')) schemaMode = 'multi';
  else if (names.includes('id')) schemaMode = 'simple';
  else schemaMode = 'simple';
  return schemaMode;
}

function mapRow(row) {
  if (!row) return null;
  if (schemaMode === 'multi') {
    return {
      id: row.note_id,
      user_id: row.user_id,
      notebook_id: row.notebook_id,
      title: row.title,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }
  return {
    id: row.id,
    user_id: null,
    notebook_id: null,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

exports.getAllNotes = async (userId) => {
  await detectSchema();
  let res;
  if (schemaMode === 'multi') {
    res = await pool.query('SELECT note_id, user_id, notebook_id, title, content, created_at, updated_at FROM notes WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  } else {
    res = await pool.query('SELECT id, title, content, created_at, updated_at FROM notes ORDER BY created_at DESC');
  }
  return res.rows.map(mapRow);
};

exports.getNoteById = async (userId, id) => {
  await detectSchema();
  let res;
  if (schemaMode === 'multi') {
    res = await pool.query('SELECT note_id, user_id, notebook_id, title, content, created_at, updated_at FROM notes WHERE user_id=$1 AND note_id=$2', [userId, id]);
  } else {
    res = await pool.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE id=$1', [id]);
  }
  return mapRow(res.rows[0]);
};

exports.createNote = async (userId, notebookId, title, content) => {
  await detectSchema();
  let res;
  if (schemaMode === 'multi') {
    res = await pool.query('INSERT INTO notes (user_id, notebook_id, title, content) VALUES ($1,$2,$3,$4) RETURNING note_id, user_id, notebook_id, title, content, created_at, updated_at', [userId, notebookId || null, title, content]);
  } else {
    res = await pool.query('INSERT INTO notes (title, content) VALUES ($1,$2) RETURNING id, title, content, created_at, updated_at', [title, content]);
  }
  return mapRow(res.rows[0]);
};

exports.updateNote = async (userId, id, title, content, notebookId) => {
  await detectSchema();
  let res;
  if (schemaMode === 'multi') {
    res = await pool.query('UPDATE notes SET title=$1, content=$2, notebook_id=$3, updated_at=CURRENT_TIMESTAMP WHERE user_id=$4 AND note_id=$5 RETURNING note_id, user_id, notebook_id, title, content, created_at, updated_at', [title, content, notebookId || null, userId, id]);
  } else {
    res = await pool.query('UPDATE notes SET title=$1, content=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3 RETURNING id, title, content, created_at, updated_at', [title, content, id]);
  }
  return mapRow(res.rows[0]);
};

exports.deleteNote = async (userId, id) => {
  await detectSchema();
  let res;
  if (schemaMode === 'multi') {
    res = await pool.query('DELETE FROM notes WHERE user_id=$1 AND note_id=$2 RETURNING note_id AS id', [userId, id]);
  } else {
    res = await pool.query('DELETE FROM notes WHERE id=$1 RETURNING id', [id]);
  }
  return res.rows[0] || null;
};

exports._debugSchema = detectSchema;