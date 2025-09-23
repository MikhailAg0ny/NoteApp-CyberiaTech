const tagModel = require('../models/tagModel');

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
    const tags = await tagModel.listTags(userId);
    res.json(tags);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.create = async (req, res) => {
  const userId = requireUser(req, res); if (!userId) return;
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const tag = await tagModel.createTag(userId, name);
    res.status(201).json(tag);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  const userId = requireUser(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params.id, 10);
    const del = await tagModel.deleteTag(userId, id);
    if (!del) return res.status(404).json({ error: 'tag not found' });
    res.json({ success: true, id: del.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
