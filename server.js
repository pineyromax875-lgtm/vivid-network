const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE;
const sessions = new Map();
const allowedFiles = new Set(['reviews.json', 'gallery.json', 'about.json', 'commands.json', 'errors.json']);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(process.cwd()));

function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clean(item)]));
  return typeof value === 'string' ? value.trim() : value;
}

function authenticated(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expires = sessions.get(token);
  if (!token || !expires || expires < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  req.sessionToken = token;
  return next();
}

function fileFor(name) {
  return path.join(process.cwd(), name);
}

app.get('/health', (req, res) => res.json({ ok: true, status: 'healthy' }));

app.post('/api/auth', (req, res) => {
  if (!ADMIN_PASSCODE) return res.status(503).json({ ok: false, error: 'ADMIN_PASSCODE is not configured on the server' });
  const passcode = String((req.body || {}).passcode || '');
  if (!crypto.timingSafeEqual(Buffer.from(passcode), Buffer.from(ADMIN_PASSCODE))) {
    return res.status(401).json({ ok: false, error: 'Invalid passcode' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + 8 * 60 * 60 * 1000);
  return res.json({ ok: true, token, expiresIn: 28800 });
});

app.post('/api/logout', authenticated, (req, res) => {
  sessions.delete(req.sessionToken);
  res.json({ ok: true });
});

app.get('/api/data/:name', (req, res) => {
  const name = req.params.name;
  if (!allowedFiles.has(name)) return res.status(400).json({ ok: false, error: 'Invalid resource' });
  const file = fileFor(name);
  if (!fs.existsSync(file)) return res.json({ ok: true, data: name === 'about.json' ? {} : [] });
  try {
    return res.json({ ok: true, data: JSON.parse(fs.readFileSync(file, 'utf8')) });
  } catch {
    return res.status(500).json({ ok: false, error: 'Resource is not valid JSON' });
  }
});

app.post('/api/data/:name', authenticated, (req, res) => {
  const name = req.params.name;
  if (!allowedFiles.has(name)) return res.status(400).json({ ok: false, error: 'Invalid resource' });
  const payload = clean(req.body && Object.prototype.hasOwnProperty.call(req.body, 'data') ? req.body.data : req.body);
  fs.writeFileSync(fileFor(name), JSON.stringify(payload, null, 2) + '\n', 'utf8');
  return res.json({ ok: true, saved: name });
});

app.listen(PORT, () => console.log(`Vivid Network server listening on port ${PORT}`));
