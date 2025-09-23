const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

router.get('/', tagController.list);
router.post('/', tagController.create);
router.delete('/:id', tagController.remove);

module.exports = router;
