const noteModel = require('../models/noteModel');

function requireUser(req, res) {
  if (!req.user || !req.user.user_id) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return req.user.user_id;
}

exports.getAllNotes = async (req, res) => {
  try {
  const userId = requireUser(req, res); if (!userId) return;
    const notes = await noteModel.getAllNotes(userId, { includeDeleted: false });
    res.json(notes);
  } catch (err) {
    console.error('GET /api/notes failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTrash = async (req, res) => {
  try {
    const userId = requireUser(req, res); if (!userId) return;
    const notes = await noteModel.getAllNotes(userId, { onlyDeleted: true });
    res.json(notes);
  } catch (err) {
    console.error('GET /api/notes/trash failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSingleNote = async (req, res) => {
  try {
  const userId = requireUser(req, res); if (!userId) return;
    const id = parseInt(req.params.id, 10);
    const note = await noteModel.getNoteById(userId, id);
    if (!note) return res.status(404).json({ error: 'note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    const userId = requireUser(req, res); if (!userId) return;
    const { title, content, notebook_id, tags, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    const hasChain = Boolean(tx_hash || tx_status || cardano_address || chain_action || chain_label || chain_metadata);
    const resolvedTxStatus = hasChain ? (tx_status || 'pending') : null;
    const note = await noteModel.createNote(
      userId,
      notebook_id,
      title,
      content,
      Array.isArray(tags) ? tags : [],
      {
        tx_hash: tx_hash || null,
        tx_status: resolvedTxStatus,
        cardano_address: cardano_address || null,
        chain_action: chain_action || 'create',
        chain_label: chain_label || null,
        chain_metadata: chain_metadata || null,
      }
    );
    res.status(201).json(note);
  } catch (err) {
    console.error('POST /api/notes failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const userId = requireUser(req, res); if (!userId) return;
    const id = parseInt(req.params.id, 10);
    const { title, content, notebook_id, tags, tx_hash, tx_status, cardano_address, chain_action, chain_label, chain_metadata } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    const hasChain = Boolean(tx_hash || tx_status || cardano_address || chain_action || chain_label || chain_metadata);
    const resolvedTxStatus = hasChain ? (tx_status || 'pending') : null;
    const updated = await noteModel.updateNote(
      userId,
      id,
      title,
      content,
      notebook_id,
      Array.isArray(tags) ? tags : undefined,
      {
        tx_hash: tx_hash || null,
        tx_status: resolvedTxStatus,
        cardano_address: cardano_address || null,
        chain_action: chain_action || 'update',
        chain_label: chain_label || null,
        chain_metadata: chain_metadata || null,
      }
    );
    if (!updated) return res.status(404).json({ error: 'note not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/notes/:id failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
  const userId = requireUser(req, res); if (!userId) return;
    const id = parseInt(req.params.id, 10);
    const deleted = await noteModel.deleteNote(userId, id);
    if (!deleted) return res.status(404).json({ error: 'note not found' });
    res.json({ success: true, id: deleted.id, deleted_at: deleted.deleted_at || new Date().toISOString() });
  } catch (err) {
    console.error('DELETE /api/notes/:id failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.restoreNote = async (req, res) => {
  try {
    const userId = requireUser(req, res); if (!userId) return;
    const id = parseInt(req.params.id, 10);
    const restored = await noteModel.restoreNote(userId, id);
    if (!restored) return res.status(404).json({ error: 'note not found or soft delete not supported' });
    const note = await noteModel.getNoteById(userId, id);
    res.json(note);
  } catch (err) {
    console.error('POST /api/notes/:id/restore failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.permanentDeleteNote = async (req, res) => {
  try {
    const userId = requireUser(req, res); if (!userId) return;
    const id = parseInt(req.params.id, 10);
    const deleted = await noteModel.hardDeleteNote(userId, id);
    if (!deleted) return res.status(404).json({ error: 'note not found' });
    res.json({ success: true, id: deleted.id });
  } catch (err) {
    console.error('POST /api/notes/:id/permanent failed:', err);
    res.status(500).json({ error: err.message });
  }
};
