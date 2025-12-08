const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');

router.get('/', notesController.getAllNotes);
router.get('/trash', notesController.getTrash);
router.get('/:id', notesController.getSingleNote);
router.post('/', notesController.createNote);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);
router.post('/:id/restore', notesController.restoreNote);
router.post('/:id/permanent', notesController.permanentDeleteNote);

module.exports = router;
