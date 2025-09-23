const express = require('express');
const router = express.Router();
const notebookController = require('../controllers/notebookController');

router.get('/', notebookController.list);
router.post('/', notebookController.create);
router.put('/:id', notebookController.update);
router.delete('/:id', notebookController.remove);

module.exports = router;
