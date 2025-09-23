const noteModel = require('../models/noteModel');

exports.getAllNotes = async (req, res) => {
  try {
    const notes = await noteModel.getAllNotes();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    const note = await noteModel.createNote(title, content);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });
    const updated = await noteModel.updateNote(id, title, content);
    if (!updated) return res.status(404).json({ error: 'note not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await noteModel.deleteNote(id);
    if (!deleted) return res.status(404).json({ error: 'note not found' });
    res.json({ success: true, id: deleted.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
