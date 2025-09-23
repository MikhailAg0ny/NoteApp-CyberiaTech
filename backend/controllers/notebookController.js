const notebookModel = require('../models/notebookModel');

function requireUser(req, res) {
  if (!req.user || !req.user.user_id) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  return req.user.user_id;
}

exports.list = async (req, res) => {
  const userId = requireUser(req, res); if (!userId) return;
  try {
    const notebooks = await notebookModel.listNotebooks(userId);
    res.json(notebooks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.create = async (req, res) => {
  const userId = requireUser(req, res); if (!userId) return;
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const nb = await notebookModel.createNotebook(userId, name);
    res.status(201).json(nb);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  const userId = requireUser(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params.id, 10);
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const nb = await notebookModel.updateNotebook(userId, id, name);
    if (!nb) return res.status(404).json({ error: 'notebook not found' });
    res.json(nb);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  const userId = requireUser(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params.id, 10);
    const del = await notebookModel.deleteNotebook(userId, id);
    if (!del) return res.status(404).json({ error: 'notebook not found' });
    res.json({ success: true, id: del.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
