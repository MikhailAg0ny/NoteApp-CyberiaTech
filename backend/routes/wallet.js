const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');

router.get('/config', walletController.getConfig);
router.post('/balance', walletController.getBalance);
router.post('/utxos', walletController.getUtxos);
router.post('/transactions', walletController.getTransactions);
router.post('/submit', walletController.submitTransaction);
router.get('/account', walletController.getLinkedWallet);
router.post('/link', walletController.linkWallet);
router.delete('/link', walletController.unlinkWallet);

module.exports = router;
