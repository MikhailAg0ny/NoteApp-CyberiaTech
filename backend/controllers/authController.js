const pool = require('../models/../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

function sign(user_id) {
  return jwt.sign({ user_id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '1h' });
}

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const existing = await pool.query('SELECT user_id FROM users WHERE email=$1', [email]);
    if (existing.rowCount) return res.status(409).json({ error: 'email already used' });
    const hash = await bcrypt.hash(password, 10);
    const derivedUsername = (email.split('@')[0] || 'user').slice(0, 100);
    const ins = await pool.query('INSERT INTO users (username, email, password_hash) VALUES ($1,$2,$3) RETURNING user_id, username, email, created_at', [derivedUsername, email, hash]);
    const token = sign(ins.rows[0].user_id);
    res.status(201).json({ token, user: ins.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const userRes = await pool.query('SELECT user_id, password_hash, username, email FROM users WHERE email=$1', [email]);
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
