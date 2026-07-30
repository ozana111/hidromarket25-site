const express = require('express');
const path = require('path');
const seed = require('./db/seed');
const { i18nMiddleware } = require('./lib/i18n');

seed();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(i18nMiddleware);

const pagesRouter = require('./routes/pages');
app.use('/', pagesRouter);
app.use('/api', require('./routes/api'));

app.use((req, res) => {
  res.status(404).render('404', {
    site: pagesRouter.SITE,
    page: '404',
    canonicalPath: req.path,
    robots: 'noindex, follow'
  });
});

app.listen(PORT, () => {
  console.log(`Hidromarket 25 site running at http://localhost:${PORT}`);
});
