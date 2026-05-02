const express = require('express');
const router = express.Router();
const ctrl = require('./prestamo.controller');

router.get('/',                      ctrl.getPrestamos);
router.post('/',                     ctrl.createPrestamo);
router.get('/ultimo-comprobante',    ctrl.getUltimoComprobante);
router.get('/:id/detalles',          ctrl.getDetallesPrestamo);
router.post('/procesar-mensualidad', ctrl.procesarMensualidad);

module.exports = router;
