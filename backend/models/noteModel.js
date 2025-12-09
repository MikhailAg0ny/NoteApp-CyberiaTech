const pool = require('../db');

let schemaMode = null; // 'multi' | 'simple'
let supportsSoftDelete = false;

async function detectSchema() {
  if (schemaMode) return schemaMode;
  const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='notes'");
  const names = cols.rows.map(r => r.column_name);
  if (names.includes('note_id') && names.includes('user_id')) schemaMode = 'multi';
  else if (names.includes('id')) schemaMode = 'simple';
  else schemaMode = 'simple';
  supportsSoftDelete = names.includes('deleted_at');
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
      tx_hash: row.tx_hash || null,
      tx_status: row.tx_status || null,
      cardano_address: row.cardano_address || null,
      chain_action: row.chain_action || null,
      chain_label: row.chain_label || null,
      chain_metadata: row.chain_metadata || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at || null,
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
    tx_hash: row.tx_hash || null,
    tx_status: row.tx_status || null,
    cardano_address: row.cardano_address || null,
    chain_action: row.chain_action || null,
    chain_label: row.chain_label || null,
    chain_metadata: row.chain_metadata || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at || null,
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

exports.getAllNotes = async (userId, options = {}) => {
  await detectSchema();
  const includeDeleted = Boolean(options.includeDeleted);
  const onlyDeleted = Boolean(options.onlyDeleted);
  const ttlClause = supportsSoftDelete
    ? "AND (n.deleted_at IS NULL OR n.deleted_at > NOW() - INTERVAL '30 days')"
    : "";

  let rows;
  if (schemaMode === 'multi') {
    const clauses = ["n.user_id=$1"];
    if (supportsSoftDelete) {
      if (onlyDeleted) {
        clauses.push("n.deleted_at IS NOT NULL");
        clauses.push("n.deleted_at > NOW() - INTERVAL '30 days'");
      } else if (!includeDeleted) {
        clauses.push("(n.deleted_at IS NULL)");
      } else {
        clauses.push("(n.deleted_at IS NULL OR n.deleted_at > NOW() - INTERVAL '30 days')");
      }
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const res = await pool.query(
      `SELECT n.note_id, n.user_id, n.notebook_id, nb.name AS notebook_name, n.title, n.content, n.tx_hash, n.tx_status, n.cardano_address, n.chain_action, n.chain_label, n.chain_metadata, n.created_at, n.updated_at, n.deleted_at FROM notes n LEFT JOIN notebooks nb ON n.notebook_id=nb.notebook_id ${where} ORDER BY n.created_at DESC`,
      [userId]
    );
    rows = res.rows;
    const tagMap = await fetchTagsForNotes(rows.map(r => r.note_id));
    rows = rows.map(r => ({ ...r, tags: tagMap[r.note_id] || [] }));
  } else {
    const res = await pool.query(
      `SELECT id, title, content, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata, created_at, updated_at, deleted_at FROM notes ORDER BY created_at DESC`
    );
    rows = res.rows;
  }
  return rows.map(mapRow);
};

exports.getNoteById = async (userId, id) => {
  await detectSchema();
  if (schemaMode === 'multi') {
    const res = await pool.query(
      'SELECT n.note_id, n.user_id, n.notebook_id, nb.name AS notebook_name, n.title, n.content, n.tx_hash, n.tx_status, n.cardano_address, n.chain_action, n.chain_label, n.chain_metadata, n.created_at, n.updated_at, n.deleted_at FROM notes n LEFT JOIN notebooks nb ON n.notebook_id=nb.notebook_id WHERE n.user_id=$1 AND n.note_id=$2',
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
    const res = await pool.query('SELECT id, title, content, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata, created_at, updated_at FROM notes WHERE id=$1', [id]);
    return mapRow(res.rows[0]);
  }
};

exports.createNote = async (userId, notebookId, title, content, tagNames, txMeta = {}) => {
  await detectSchema();
  const {
    tx_hash = null,
    tx_status = null,
    cardano_address = null,
    chain_action = null,
    chain_label = null,
    chain_metadata = null,
  } = txMeta;
  if (schemaMode === 'multi') {
    const res = await pool.query(
      'INSERT INTO notes (user_id, notebook_id, title, content, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING note_id',
      [userId, notebookId || null, title, content, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata]
    );
    const noteId = res.rows[0].note_id;
    if (Array.isArray(tagNames) && tagNames.length) {
      await setNoteTags(userId, noteId, tagNames);
    }
    return await exports.getNoteById(userId, noteId);
  } else {
    const res = await pool.query('INSERT INTO notes (title, content, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, title, content, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata, created_at, updated_at', [title, content, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata]);
    return mapRow(res.rows[0]);
  }
};

exports.updateNote = async (userId, id, title, content, notebookId, tagNames, txMeta = {}) => {
  await detectSchema();
  const {
    tx_hash = null,
    tx_status = null,
    cardano_address = null,
    chain_action = null,
    chain_label = null,
    chain_metadata = null,
  } = txMeta;
  if (schemaMode === 'multi') {
    const res = await pool.query(
      'UPDATE notes SET title=$1, content=$2, notebook_id=$3, tx_hash=COALESCE($4, tx_hash), tx_status=COALESCE($5, tx_status), cardano_address=COALESCE($6, cardano_address), chain_action=COALESCE($7, chain_action), chain_label=COALESCE($8, chain_label), chain_metadata=COALESCE($9, chain_metadata), updated_at=CURRENT_TIMESTAMP WHERE user_id=$10 AND note_id=$11 RETURNING note_id',
      [title, content, notebookId || null, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata, userId, id]
    );
    if (!res.rows[0]) return null;
    if (Array.isArray(tagNames)) {
      await setNoteTags(userId, id, tagNames);
    }
    return await exports.getNoteById(userId, id);
  } else {
    const res = await pool.query('UPDATE notes SET title=$1, content=$2, tx_hash=COALESCE($3, tx_hash), tx_status=COALESCE($4, tx_status), cardano_address=COALESCE($5, cardano_address), chain_action=COALESCE($6, chain_action), chain_label=COALESCE($7, chain_label), chain_metadata=COALESCE($8, chain_metadata), updated_at=CURRENT_TIMESTAMP WHERE id=$9 RETURNING id, title, content, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata, created_at, updated_at', [title, content, txMeta.tx_hash || null, txMeta.tx_status || null, txMeta.cardano_address || null, txMeta.chain_action || null, txMeta.chain_label || null, txMeta.chain_metadata || null, id]);
    return mapRow(res.rows[0]);
  }
};

exports._debugEnsure = async () => { await detectSchema(); };

exports.deleteNote = async (userId, id) => {
  await detectSchema();
  let res;
  if (schemaMode === 'multi') {
    if (supportsSoftDelete) {
      res = await pool.query(
        'UPDATE notes SET deleted_at=NOW() WHERE user_id=$1 AND note_id=$2 AND deleted_at IS NULL RETURNING note_id AS id, deleted_at',
        [userId, id]
      );
    } else {
      res = await pool.query('DELETE FROM notes WHERE user_id=$1 AND note_id=$2 RETURNING note_id AS id', [userId, id]);
    }
  } else {
    if (supportsSoftDelete) {
      res = await pool.query(
        'UPDATE notes SET deleted_at=NOW() WHERE id=$1 AND deleted_at IS NULL RETURNING id, deleted_at',
        [id]
      );
    } else {
      res = await pool.query('DELETE FROM notes WHERE id=$1 RETURNING id', [id]);
    }
  }
  return res.rows[0] || null;
};

exports.hardDeleteNote = async (userId, id) => {
  await detectSchema();
  let res;
  if (schemaMode === 'multi') {
    res = await pool.query('DELETE FROM notes WHERE user_id=$1 AND note_id=$2 RETURNING note_id AS id', [userId, id]);
  } else {
    res = await pool.query('DELETE FROM notes WHERE id=$1 RETURNING id', [id]);
  }
  return res.rows[0] || null;
};

exports.restoreNote = async (userId, id) => {
  await detectSchema();
  if (!supportsSoftDelete) return null;
  let res;
  if (schemaMode === 'multi') {
    res = await pool.query(
      'UPDATE notes SET deleted_at=NULL WHERE user_id=$1 AND note_id=$2 RETURNING note_id AS id',
      [userId, id]
    );
  } else {
    res = await pool.query(
      'UPDATE notes SET deleted_at=NULL WHERE id=$1 RETURNING id',
      [id]
    );
  }
  return res.rows[0] || null;
};

exports._debugSchema = detectSchema;