const express = require('express');
const router = express.Router();
const db = require('../db/database');

const searchStmt = db.prepare(`
  SELECT id, name, slug, brand, model, category
  FROM products
  WHERE search_text LIKE @pattern
  ORDER BY
    CASE WHEN lower(name) LIKE @startPattern THEN 0 ELSE 1 END,
    name ASC
  LIMIT 8
`);

router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();

  if (q.length === 0) {
    return res.json({ results: [] });
  }

  const results = searchStmt.all({
    pattern: `%${q}%`,
    startPattern: `${q}%`
  });

  res.json({ results });
});

router.post('/contact', (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ ok: false, error: 'Укажите имя и сообщение.' });
  }

  db.prepare(`
    INSERT INTO contact_messages (name, phone, email, message)
    VALUES (?, ?, ?, ?)
  `).run(name, phone || '', email || '', message);

  res.json({ ok: true });
});

module.exports = router;
