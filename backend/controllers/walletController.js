const cardanoService = require('../services/cardanoService');
const pool = require('../db');

exports.getConfig = (req, res) => {
  try {
    const config = cardanoService.getNetworkConfig();
    res.json({
      ...config,
      preferredWallet: 'lace'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const { address } = req.body || {};
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    const info = await cardanoService.getAddressInfo(address);
    res.json(info);
  } catch (err) {
    console.error('POST /api/wallet/balance failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getUtxos = async (req, res) => {
  try {
    const { address, page, count } = req.body || {};
    if (!address) {
      return res.status(400).json({ error: 'address is required' });
    }
    const data = await cardanoService.getAddressUtxos(address, { page, count });
    res.json(data);
  } catch (err) {
    console.error('POST /api/wallet/utxos failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.submitTransaction = async (req, res) => {
  try {
    const { cbor } = req.body || {};
    if (!cbor) {
      return res.status(400).json({ error: 'cbor payload is required' });
    }
    const txHash = await cardanoService.submitTransaction(cbor);
    res.json({ txHash });
  } catch (err) {
    console.error('POST /api/wallet/submit failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getLinkedWallet = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const user = await pool.query(
      `SELECT wallet_address, wallet_label, wallet_network, wallet_connected_at
       FROM users WHERE user_id=$1`,
      [userId]
    );
    if (!user.rowCount || !user.rows[0].wallet_address) {
      return res.json({ wallet: null });
    }
    return res.json({ wallet: user.rows[0] });
  } catch (err) {
    console.error('GET /api/wallet/account failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.linkWallet = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const { address, label, network } = req.body || {};
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'address is required' });
    }
    const normalizedAddress = address.trim();
    if (normalizedAddress.length < 20) {
      return res.status(400).json({ error: 'address looks invalid' });
    }
    const normalizedNetwork = (network || 'mainnet').toLowerCase();

    const result = await pool.query(
      `UPDATE users SET
         wallet_address=$1,
         wallet_label=$2,
         wallet_network=$3,
         wallet_connected_at=NOW()
       WHERE user_id=$4
       RETURNING wallet_address, wallet_label, wallet_network, wallet_connected_at`,
      [normalizedAddress, label || null, normalizedNetwork, userId]
    );
    return res.json({ wallet: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'wallet already linked to another user' });
    }
    console.error('POST /api/wallet/link failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.unlinkWallet = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    const result = await pool.query(
      `UPDATE users SET
         wallet_address=NULL,
         wallet_label=NULL,
         wallet_network=NULL,
         wallet_connected_at=NULL
       WHERE user_id=$1
       RETURNING wallet_address, wallet_label, wallet_network, wallet_connected_at`,
      [userId]
    );
    return res.json({ wallet: result.rows[0] });
  } catch (err) {
    console.error('DELETE /api/wallet/link failed:', err.message);
    res.status(500).json({ error: err.message });
  }
};
