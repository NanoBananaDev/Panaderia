const express = require('express');
const controller = require('../controllers/productosController');

const router = express.Router();
router.get('/', controller.inicio);
router.get('/admin', controller.admin);
router.get('/admin/productos/nuevo', controller.nuevo);
router.post('/admin/productos', controller.crear);
router.get('/admin/productos/:id/editar', controller.editar);
router.post('/admin/productos/:id/editar', controller.actualizar);
router.post('/admin/productos/:id/eliminar', controller.eliminar);

module.exports = router;
