const pool = require('../models/../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function sign(user_id) {
  return jwt.sign({ user_id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '1h' });
}

const CARDANO_TEST_ADDRESS_REGEX = /^addr_test[a-z0-9]+$/i;

exports.register = async (req, res) => {
  try {
    const { email, password, cardano_address: rawAddress } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const normalizedAddress = typeof rawAddress === 'string' ? rawAddress.trim() : null;
    if (normalizedAddress && !CARDANO_TEST_ADDRESS_REGEX.test(normalizedAddress)) {
      return res.status(400).json({ error: 'cardano_address must start with addr_test for preprod usage' });
    }
    const existing = await pool.query('SELECT user_id FROM users WHERE email=$1', [email]);
    if (existing.rowCount) return res.status(409).json({ error: 'email already used' });
    if (normalizedAddress) {
      const addressCheck = await pool.query('SELECT user_id FROM users WHERE cardano_address=$1', [normalizedAddress]);
      if (addressCheck.rowCount) {
        return res.status(409).json({ error: 'cardano_address already registered' });
      }
    }
    const hash = await bcrypt.hash(password, 10);
    const derivedUsername = (email.split('@')[0] || 'user').slice(0, 100);
    const insertSql = `
      INSERT INTO users (username, email, password_hash, cardano_address)
      VALUES ($1,$2,$3,$4)
      RETURNING user_id, username, email, cardano_address, created_at
    `;
    const ins = await pool.query(insertSql, [derivedUsername, email, hash, normalizedAddress]);
    const token = sign(ins.rows[0].user_id);
    res.status(201).json({ token, user: ins.rows[0] });
  } catch (e) {
    if (e.code === '23505') {
      const isAddressConflict = e.constraint === 'idx_users_cardano_address_unique';
      return res.status(409).json({
        error: isAddressConflict ? 'cardano_address already registered' : 'email already used'
      });
    }
    res.status(500).json({ error: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const userRes = await pool.query('SELECT user_id, password_hash, username, email, cardano_address FROM users WHERE email=$1', [email]);
    if (!userRes.rowCount) return res.status(401).json({ error: 'invalid credentials' });
    const user = userRes.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const token = sign(user.user_id);
    delete user.password_hash;
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
