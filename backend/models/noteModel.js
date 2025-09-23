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
      notebook_name: row.notebook_name || null,
      title: row.title,
      content: row.content,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tags: row.tags || []
    };
  }
  return {
    id: row.id,
    user_id: null,
    notebook_id: null,
    notebook_name: null,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: []
  };
}

async function fetchTagsForNotes(noteIds) {
  if (!noteIds.length) return {};
  const res = await pool.query(
    'SELECT nt.note_id, t.tag_id, t.name FROM note_tags nt JOIN tags t ON nt.tag_id=t.tag_id WHERE nt.note_id = ANY($1)',
    [noteIds]
  );
  const map = {};
  for (const r of res.rows) {
    if (!map[r.note_id]) map[r.note_id] = [];
    map[r.note_id].push({ id: r.tag_id, name: r.name });
  }
  return map;
}

async function setNoteTags(userId, noteId, tagNames) {
  if (!Array.isArray(tagNames)) return;
  tagNames = tagNames
    .map(t => (t || '').trim())
    .filter(t => t.length)
    .slice(0, 50);
  const existingRes = await pool.query('SELECT tag_id, name FROM tags WHERE user_id=$1 AND name = ANY($2)', [userId, tagNames]);
  const existingMap = new Map(existingRes.rows.map(r => [r.name, r.tag_id]));
  const toCreate = tagNames.filter(n => !existingMap.has(n));
  for (const name of toCreate) {
    const ins = await pool.query('INSERT INTO tags (user_id, name) VALUES ($1,$2) ON CONFLICT (user_id, name) DO NOTHING RETURNING tag_id, name', [userId, name]);
    if (ins.rows[0]) existingMap.set(ins.rows[0].name, ins.rows[0].tag_id);
  }
  const tagIds = tagNames.map(n => existingMap.get(n)).filter(Boolean);
  const current = await pool.query('SELECT tag_id FROM note_tags WHERE note_id=$1', [noteId]);
  const currentSet = new Set(current.rows.map(r => r.tag_id));
  const desiredSet = new Set(tagIds);
  for (const id of desiredSet) {
    if (!currentSet.has(id)) {
      await pool.query('INSERT INTO note_tags (note_id, tag_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [noteId, id]);
    }
  }
  for (const id of currentSet) {
    if (!desiredSet.has(id)) {
      await pool.query('DELETE FROM note_tags WHERE note_id=$1 AND tag_id=$2', [noteId, id]);
    }
  }
}

exports.getAllNotes = async (userId) => {
  await detectSchema();
  let rows;
  if (schemaMode === 'multi') {
    const res = await pool.query(
      'SELECT n.note_id, n.user_id, n.notebook_id, nb.name AS notebook_name, n.title, n.content, n.created_at, n.updated_at FROM notes n LEFT JOIN notebooks nb ON n.notebook_id=nb.notebook_id WHERE n.user_id=$1 ORDER BY n.created_at DESC',
      [userId]
    );
    rows = res.rows;
    const tagMap = await fetchTagsForNotes(rows.map(r => r.note_id));
    rows = rows.map(r => ({ ...r, tags: tagMap[r.note_id] || [] }));
  } else {
    const res = await pool.query('SELECT id, title, content, created_at, updated_at FROM notes ORDER BY created_at DESC');
    rows = res.rows;
  }
  return rows.map(mapRow);
};

exports.getNoteById = async (userId, id) => {
  await detectSchema();
  if (schemaMode === 'multi') {
    const res = await pool.query(
      'SELECT n.note_id, n.user_id, n.notebook_id, nb.name AS notebook_name, n.title, n.content, n.created_at, n.updated_at FROM notes n LEFT JOIN notebooks nb ON n.notebook_id=nb.notebook_id WHERE n.user_id=$1 AND n.note_id=$2',
      [userId, id]
    );
    const row = res.rows[0];
    if (!row) return null;
    const tagRes = await pool.query(
      'SELECT t.tag_id, t.name FROM note_tags nt JOIN tags t ON nt.tag_id=t.tag_id WHERE nt.note_id=$1',
      [id]
    );
    row.tags = tagRes.rows.map(r => ({ id: r.tag_id, name: r.name }));
    return mapRow(row);
  } else {
    const res = await pool.query('SELECT id, title, content, created_at, updated_at FROM notes WHERE id=$1', [id]);
    return mapRow(res.rows[0]);
  }
};

exports.createNote = async (userId, notebookId, title, content, tagNames) => {
  await detectSchema();
  if (schemaMode === 'multi') {
    const res = await pool.query(
      'INSERT INTO notes (user_id, notebook_id, title, content) VALUES ($1,$2,$3,$4) RETURNING note_id',
      [userId, notebookId || null, title, content]
    );
    const noteId = res.rows[0].note_id;
    if (Array.isArray(tagNames) && tagNames.length) {
      await setNoteTags(userId, noteId, tagNames);
    }
    return await exports.getNoteById(userId, noteId);
  } else {
    const res = await pool.query('INSERT INTO notes (title, content) VALUES ($1,$2) RETURNING id, title, content, created_at, updated_at', [title, content]);
    return mapRow(res.rows[0]);
  }
};

exports.updateNote = async (userId, id, title, content, notebookId, tagNames) => {
  await detectSchema();
  if (schemaMode === 'multi') {
    const res = await pool.query(
      'UPDATE notes SET title=$1, content=$2, notebook_id=$3, updated_at=CURRENT_TIMESTAMP WHERE user_id=$4 AND note_id=$5 RETURNING note_id',
      [title, content, notebookId || null, userId, id]
    );
    if (!res.rows[0]) return null;
    if (Array.isArray(tagNames)) {
      await setNoteTags(userId, id, tagNames);
    }
    return await exports.getNoteById(userId, id);
  } else {
    const res = await pool.query('UPDATE notes SET title=$1, content=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3 RETURNING id, title, content, created_at, updated_at', [title, content, id]);
    return mapRow(res.rows[0]);
  }
};

exports._debugEnsure = async () => { await detectSchema(); };

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