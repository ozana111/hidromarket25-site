const fs = require('fs');
const path = require('path');

const SUPPORTED = ['ru', 'ro', 'tr', 'en'];
const DEFAULT_LANG = 'ru';

const dictionaries = {};
for (const lang of SUPPORTED) {
  dictionaries[lang] = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'locales', `${lang}.json`), 'utf8')
  );
}

function getByPath(obj, key) {
  return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (match, name) => (vars[name] !== undefined ? vars[name] : match));
}

function translate(lang, key, vars) {
  let value = getByPath(dictionaries[lang], key);
  if (value === undefined) value = getByPath(dictionaries[DEFAULT_LANG], key);
  if (value === undefined) return key;
  return interpolate(value, vars);
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    cookies[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return cookies;
}

// Product rows carry name/description in Russian plus optional per-language
// overrides (name_tr, description_ro, etc.). Swap in the localized text for
// the current language, falling back to Russian when a translation is missing.
function localizeProduct(product, lang) {
  if (!product || lang === DEFAULT_LANG) return product;
  const localizedName = product[`name_${lang}`];
  const localizedDescription = product[`description_${lang}`];
  return {
    ...product,
    name: localizedName || product.name,
    description: localizedDescription || product.description
  };
}

function localizeProducts(products, lang) {
  return products.map((p) => localizeProduct(p, lang));
}

function i18nMiddleware(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const queryLang = SUPPORTED.includes(req.query.lang) ? req.query.lang : null;

  if (queryLang) {
    res.cookie('lang', queryLang, { maxAge: 365 * 24 * 60 * 60 * 1000 });
    const cleanQuery = { ...req.query };
    delete cleanQuery.lang;
    const qs = new URLSearchParams(cleanQuery).toString();
    return res.redirect(req.path + (qs ? `?${qs}` : ''));
  }

  const lang = SUPPORTED.includes(cookies.lang) ? cookies.lang : DEFAULT_LANG;
  res.locals.lang = lang;
  res.locals.langs = SUPPORTED;
  res.locals.t = (key, vars) => translate(lang, key, vars);
  next();
}

module.exports = { i18nMiddleware, SUPPORTED, DEFAULT_LANG, localizeProduct, localizeProducts };
