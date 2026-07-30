const express = require('express');
const router = express.Router();
const db = require('../db/database');

const SITE = {
  companyName: 'Hidromarket 25 SRL',
  partner: 'Hipomak',
  email: 'hidromarket25@gmail.com',
  phone: '+373 79 180 945',
  servicePhone: '+373 79 752 545',
  tiktok: 'https://www.tiktok.com/@hseyin.kocatrk65',
  instagram: 'https://www.instagram.com/hidromarket25',
  founded: 2014,
  baseUrl: process.env.SITE_URL || 'http://localhost:3000'
};

// From large equipment to small parts, mirroring hipomak.ru's catalog structure.
const CATEGORY_ORDER = [
  'pto',
  'gearPumps',
  'hydraulicHoses',
  'pistonPumps',
  'valves',
  'cylinders',
  'controls',
  'cardanShafts',
  'oilCoolers',
  'oilTanks',
  'filters',
  'plates',
  'flanges',
  'couplings',
  'adapters',
  'connectors',
  'mountingKits',
  'serviceKits'
];

function byCategoryOrder(categoryKey) {
  const idx = CATEGORY_ORDER.indexOf(categoryKey);
  return idx === -1 ? CATEGORY_ORDER.length : idx;
}

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\n\nSitemap: ${SITE.baseUrl}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (req, res) => {
  const staticPaths = ['/', '/uslugi', '/katalog', '/o-nas', '/kontakty'];
  const products = db.prepare('SELECT slug FROM products').all();
  const urls = [
    ...staticPaths.map((p) => `  <url><loc>${SITE.baseUrl}${p}</loc></url>`),
    ...products.map((p) => `  <url><loc>${SITE.baseUrl}/katalog/${p.slug}</loc></url>`)
  ].join('\n');
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
});

router.get('/', (req, res) => {
  const featured = db.prepare('SELECT * FROM products ORDER BY RANDOM() LIMIT 6').all();
  const totalProducts = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  const totalCategories = db.prepare('SELECT COUNT(DISTINCT category) AS c FROM products').get().c;
  res.render('index', { site: SITE, page: 'home', featured, totalProducts, totalCategories, canonicalPath: '/' });
});

router.get('/uslugi', (req, res) => {
  res.render('services', { site: SITE, page: 'services', canonicalPath: '/uslugi' });
});

router.get('/katalog', (req, res) => {
  const categoryFilter = req.query.category || null;
  const categories = db
    .prepare('SELECT DISTINCT category FROM products')
    .all()
    .map((r) => r.category)
    .sort((a, b) => byCategoryOrder(a) - byCategoryOrder(b));

  const products = categoryFilter
    ? db.prepare('SELECT * FROM products WHERE category = ? ORDER BY name').all(categoryFilter)
    : db
        .prepare('SELECT * FROM products ORDER BY name')
        .all()
        .sort((a, b) => byCategoryOrder(a.category) - byCategoryOrder(b.category));

  res.render('catalog', {
    site: SITE,
    page: 'catalog',
    products,
    categories,
    activeCategory: categoryFilter,
    canonicalPath: '/katalog'
  });
});

router.get('/katalog/:slug', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(req.params.slug);
  if (!product) {
    return res.status(404).render('404', { site: SITE, page: '404', canonicalPath: req.path, robots: 'noindex, follow' });
  }
  const related = db
    .prepare('SELECT * FROM products WHERE category = ? AND id != ? LIMIT 4')
    .all(product.category, product.id);
  res.render('product', { site: SITE, page: 'catalog', product, related, canonicalPath: `/katalog/${product.slug}` });
});

router.get('/o-nas', (req, res) => {
  res.render('about', { site: SITE, page: 'about', canonicalPath: '/o-nas' });
});

router.get('/kontakty', (req, res) => {
  res.render('contacts', { site: SITE, page: 'contacts', canonicalPath: '/kontakty' });
});

module.exports = router;
module.exports.SITE = SITE;
