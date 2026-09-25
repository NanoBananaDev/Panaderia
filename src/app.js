require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const productosRoutes = require('./routes/productos');
const { waitForDatabase, initializeDatabase, hasDatabase } = require('./database/pool');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.formatPrice = (price) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(price));
  next();
});
app.use(productosRoutes);
app.use((req, res) => res.status(404).render('404'));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render('error');
});

if (hasDatabase) {
  app.use(async (req, res, next) => {
    try {
      await initializeDatabase();
      next();
    } catch (error) { next(error); }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  waitForDatabase()
    .then(() => app.listen(port, '0.0.0.0', () => console.log(`Panadería Delicia disponible en el puerto ${port}.`)))
    .catch((error) => {
      console.error('No fue posible conectar con PostgreSQL. Revisa las variables de entorno y los logs.', error);
      process.exit(1);
    });
}

module.exports = app;
