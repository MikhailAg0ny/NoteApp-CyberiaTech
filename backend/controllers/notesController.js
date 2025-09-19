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
